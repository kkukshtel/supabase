import { format } from 'sql-formatter'

export const CodeEditor = ({ content = '' }: { content: string }) => {
  const code = format(content, { language: 'postgresql' })

  return (
    <div className="w-1/3 flex flex-col ">
      <span className="whitespace-pre">{code}</span>
    </div>
  )
}
