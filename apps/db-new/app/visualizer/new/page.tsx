'use client'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Chat } from '../Chat'
import { CodeEditor } from '../CodeEditor'
import SchemaGraph from '../SchemaGraph'

export default function NewThread() {
  const router = useRouter()

  const { mutate } = useMutation({
    mutationFn: async (prompt: string) => {
      const body = { prompt }
      const response = await fetch('/api/ai/sql/threads/create', {
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
      console.log(url)
      router.push(url)
    },
  })

  return (
    <main className="flex min-h-screen flex-row items-center justify-between">
      <Chat onSubmit={(v) => mutate(v)} messages={[]} selected={undefined} onSelect={() => {}} />
      <CodeEditor content={''} />
      <SchemaGraph tables={[]} />
    </main>
  )
}
