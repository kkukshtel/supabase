'use client'
import { AssistantMessage, Message, ReadThreadAPIResult } from '@/lib/types'
import { parseTables } from '@/lib/utils'
import { useMutation, useQuery } from '@tanstack/react-query'
import { last } from 'lodash'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Chat } from '../../Chat'
import { CodeEditor } from '../../CodeEditor'
import SchemaGraph from '../../SchemaGraph'

export default function ThreadPage({ params }: { params: { threadId: string; runId: string } }) {
  const router = useRouter()
  const [selectedMessageId, setSelectedMessageId] = useState<string | undefined>(undefined)
  const [tables, setTables] = useState<any[]>([])
  const { data, isSuccess } = useQuery<ReadThreadAPIResult>({
    queryFn: async () => {
      const response = await fetch(`/api/ai/sql/threads/${params.threadId}/read/${params.runId}`, {
        method: 'GET',
      })

      const result = await response.json()
      return result
    },
    queryKey: [params.threadId, params.runId],
    refetchInterval: (options) => {
      const data = options.state.data
      if (data && data.status === 'completed') {
        return Infinity
      }
      return 5000
    },
    enabled: !!(params.threadId && params.runId),
  })

  const { mutate } = useMutation({
    mutationFn: async (prompt: string) => {
      const body = { prompt }
      const response = await fetch(`/api/ai/sql/threads/${params.threadId}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const result = await response.json()
      return result
    },
    onSuccess(data) {
      const url = `/visualizer/${data.threadId}/${data.runId}`
      router.push(url)
    },
  })

  let messages: Message[] = []
  if (isSuccess) {
    messages = [...data.messages].sort((m) => m.created_at)
    const lastMessage = last(messages.filter((m) => m.role === 'assistant'))
    if (lastMessage && selectedMessageId === undefined) {
      setSelectedMessageId(lastMessage.id)
    }
  }

  let content = ''
  const selectedMessage = messages.find((m) => m.id === selectedMessageId) as
    | AssistantMessage
    | undefined
  if (selectedMessage) {
    content = selectedMessage.sql.replaceAll('```sql', '').replaceAll('```', '')
    parseTables(content).then((t) => {
      if (tables.length !== t.length) {
        setTables(t)
      }
    })
  }

  console.log(tables)
  return (
    <main className="flex min-h-screen flex-row items-center justify-between">
      <Chat
        messages={messages}
        loading={isSuccess && data.status === 'loading'}
        selected={selectedMessageId}
        onSubmit={(str) => mutate(str)}
        onSelect={(id) => setSelectedMessageId(id)}
      />
      <CodeEditor content={content} />
      <SchemaGraph tables={tables} />
    </main>
  )
}
