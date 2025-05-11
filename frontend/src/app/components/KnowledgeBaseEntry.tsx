"use client";

import { useState } from "react";
import { toast } from "sonner";

interface KnowledgeEntry {
  id?: string;
  question: string;
  answer: string;
}

interface KnowledgeBaseEntryProps {
  entry: KnowledgeEntry;
  onSave?: (entry: KnowledgeEntry) => Promise<void>;
  readOnly?: boolean;
}

export default function KnowledgeBaseEntry({ 
  entry, 
  onSave,
  readOnly = false 
}: KnowledgeBaseEntryProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [question, setQuestion] = useState(entry.question);
  const [answer, setAnswer] = useState(entry.answer);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!question.trim() || !answer.trim()) {
      toast.error("Question and answer are required");
      return;
    }

    if (onSave) {
      try {
        setIsSaving(true);
        await onSave({ ...entry, question, answer });
        toast.success("Knowledge base entry saved");
        setIsEditing(false);
      } catch (error) {
        console.error("Error saving entry:", error);
        toast.error("Failed to save entry");
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200 mb-4">
      {isEditing && !readOnly ? (
        <>
          <div className="mb-4">
            <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-1">
              Question
            </label>
            <input
              id="question"
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter question"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-1">
              Answer
            </label>
            <textarea
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Enter answer"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-lg text-gray-800">{question}</h3>
            {!readOnly && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-blue-500 hover:text-blue-700"
              >
                Edit
              </button>
            )}
          </div>
          <div className="mt-3 bg-gray-50 p-3 rounded">
            <p className="text-gray-800">{answer}</p>
          </div>
        </>
      )}
    </div>
  );
}