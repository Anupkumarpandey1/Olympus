
import type React from "react"
import { cn } from "@/lib/utils"

interface FormattedMessageProps {
  content: string
  className?: string
}

export function FormattedMessage({ content, className }: FormattedMessageProps) {
  // Parse the content to identify headings, lists, and paragraphs
  const formattedContent = parseContent(content)

  return <div className={cn("prose prose-sm dark:prose-invert max-w-none", className)}>{formattedContent}</div>
}

function parseContent(content: string): React.ReactNode {
  // Clean up the content by removing markdown syntax
  const cleanedContent = content
    .replace(/^### /gm, "") // Remove ### at the beginning of lines
    .replace(/^#### /gm, "") // Remove #### at the beginning of lines

  // Split the content by line breaks
  const lines = cleanedContent.split("\n")
  const elements: React.ReactNode[] = []

  let currentList: React.ReactNode[] = []
  let inList = false
  let inNumberedList = false

  lines.forEach((line, index) => {
    const trimmedLine = line.trim()

    // Skip empty lines
    if (!trimmedLine) {
      if ((inList || inNumberedList) && currentList.length > 0) {
        if (inNumberedList) {
          elements.push(
            <ol key={`list-${index}`} className="my-3 list-decimal pl-6">
              {currentList}
            </ol>,
          )
        } else {
          elements.push(
            <ul key={`list-${index}`} className="my-3 list-disc pl-6">
              {currentList}
            </ul>,
          )
        }
        currentList = []
        inList = false
        inNumberedList = false
      }
      return
    }

    // Check for main headings (previously ### headings)
    if (trimmedLine.match(/^[A-Z][\w\s]+[A-Za-z]$/)) {
      if ((inList || inNumberedList) && currentList.length > 0) {
        if (inNumberedList) {
          elements.push(
            <ol key={`list-${index}`} className="my-3 list-decimal pl-6">
              {currentList}
            </ol>,
          )
        } else {
          elements.push(
            <ul key={`list-${index}`} className="my-3 list-disc pl-6">
              {currentList}
            </ul>,
          )
        }
        currentList = []
        inList = false
        inNumberedList = false
      }

      elements.push(
        <h2 key={`h2-${index}`} className="text-2xl font-bold mt-6 mb-3 text-primary border-b pb-1">
          {trimmedLine}
        </h2>,
      )
      return
    }

    // Check for subheadings (previously #### headings)
    if (
      trimmedLine.match(/^[A-Z][\w\s]+:$/) ||
      (trimmedLine.match(/^[A-Z][\w\s]+[A-Za-z]$/) && trimmedLine.length < 30)
    ) {
      if ((inList || inNumberedList) && currentList.length > 0) {
        if (inNumberedList) {
          elements.push(
            <ol key={`list-${index}`} className="my-3 list-decimal pl-6">
              {currentList}
            </ol>,
          )
        } else {
          elements.push(
            <ul key={`list-${index}`} className="my-3 list-disc pl-6">
              {currentList}
            </ul>,
          )
        }
        currentList = []
        inList = false
        inNumberedList = false
      }

      elements.push(
        <h3 key={`h3-${index}`} className="text-xl font-semibold mt-5 mb-2 text-primary/90">
          {trimmedLine}
        </h3>,
      )
      return
    }

    // Process bold text (**text**)
    const processedLine = processBoldText(trimmedLine)

    // Check for list items
    if (trimmedLine.startsWith("* ") || trimmedLine.startsWith("- ")) {
      inList = true
      const listItemText = trimmedLine.replace(/^[*-]\s+/, "")
      currentList.push(<li key={`li-${index}`}>{processBoldText(listItemText)}</li>)
      return
    }

    // Check for numbered list items
    if (/^\d+\.\s/.test(trimmedLine)) {
      inNumberedList = true
      const listItemText = trimmedLine.replace(/^\d+\.\s+/, "")
      currentList.push(<li key={`li-${index}`}>{processBoldText(listItemText)}</li>)
      return
    }

    // Regular paragraph
    if ((inList || inNumberedList) && currentList.length > 0) {
      if (inNumberedList) {
        elements.push(
          <ol key={`list-${index}`} className="my-3 list-decimal pl-6">
            {currentList}
          </ol>,
        )
      } else {
        elements.push(
          <ul key={`list-${index}`} className="my-3 list-disc pl-6">
            {currentList}
          </ul>,
        )
      }
      currentList = []
      inList = false
      inNumberedList = false
    }

    elements.push(
      <p key={`p-${index}`} className="my-3">
        {processedLine}
      </p>,
    )
  })

  // Add any remaining list items
  if ((inList || inNumberedList) && currentList.length > 0) {
    if (inNumberedList) {
      elements.push(<ol className="my-3 list-decimal pl-6">{currentList}</ol>)
    } else {
      elements.push(<ul className="my-3 list-disc pl-6">{currentList}</ul>)
    }
  }

  return elements
}

function processBoldText(text: string): React.ReactNode {
  // Split the text by ** markers
  const parts = text.split(/\*\*/)

  if (parts.length === 1) {
    return text // No bold text
  }

  const result: React.ReactNode[] = []

  parts.forEach((part, index) => {
    if (index % 2 === 0) {
      // Regular text
      if (part) result.push(part)
    } else {
      // Bold text (between ** **)
      result.push(
        <span key={index} className="font-semibold text-lg text-primary/90">
          {part}
        </span>,
      )
    }
  })

  return result
}
