import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PromptDraft, UserSegment, AssistantPreset, ImageContent } from '@/types'
import { generateId } from '@/lib/utils'

interface PromptState {
  draft: PromptDraft
  setInstructionRole: (role: 'system' | 'developer') => void
  setInstructionText: (text: string) => void
  addUserSegment: () => void
  updateUserSegment: (id: string, updates: Partial<UserSegment>) => void
  removeUserSegment: (id: string) => void
  reorderUserSegments: (fromIndex: number, toIndex: number) => void
  addImageToSegment: (segmentId: string, image: ImageContent) => void
  updateImageInSegment: (segmentId: string, imageId: string, updates: Partial<ImageContent>) => void
  removeImageFromSegment: (segmentId: string, imageId: string) => void
  addAssistantPreset: () => void
  updateAssistantPreset: (id: string, updates: Partial<AssistantPreset>) => void
  removeAssistantPreset: (id: string) => void
  setVariable: (key: string, value: string) => void
  removeVariable: (key: string) => void
  resetDraft: () => void
}

const defaultDraft: PromptDraft = {
  instructionRole: 'system',
  instructionText: '',
  userSegments: [
    {
      id: generateId(),
      title: 'Main Prompt',
      enabled: true,
      text: '',
      joiner: '\n\n',
      images: [],
    },
  ],
  assistantPresets: [],
  variables: {},
}

export const usePromptStore = create<PromptState>()(
  persist(
    (set) => ({
      draft: defaultDraft,

      setInstructionRole: (role) =>
        set((state) => ({
          draft: { ...state.draft, instructionRole: role },
        })),

      setInstructionText: (text) =>
        set((state) => ({
          draft: { ...state.draft, instructionText: text },
        })),

      addUserSegment: () =>
        set((state) => ({
          draft: {
            ...state.draft,
            userSegments: [
              ...state.draft.userSegments,
              {
                id: generateId(),
                title: `Segment ${state.draft.userSegments.length + 1}`,
                enabled: true,
                text: '',
                joiner: '\n\n',
                images: [],
              },
            ],
          },
        })),

      updateUserSegment: (id, updates) =>
        set((state) => ({
          draft: {
            ...state.draft,
            userSegments: state.draft.userSegments.map((seg) =>
              seg.id === id ? { ...seg, ...updates } : seg
            ),
          },
        })),

      removeUserSegment: (id) =>
        set((state) => ({
          draft: {
            ...state.draft,
            userSegments: state.draft.userSegments.filter((seg) => seg.id !== id),
          },
        })),

      reorderUserSegments: (fromIndex, toIndex) =>
        set((state) => {
          const segments = [...state.draft.userSegments]
          const [removed] = segments.splice(fromIndex, 1)
          segments.splice(toIndex, 0, removed)
          return {
            draft: { ...state.draft, userSegments: segments },
          }
        }),

      addImageToSegment: (segmentId, image) =>
        set((state) => ({
          draft: {
            ...state.draft,
            userSegments: state.draft.userSegments.map((seg) =>
              seg.id === segmentId
                ? { ...seg, images: [...seg.images, image] }
                : seg
            ),
          },
        })),

      updateImageInSegment: (segmentId, imageId, updates) =>
        set((state) => ({
          draft: {
            ...state.draft,
            userSegments: state.draft.userSegments.map((seg) =>
              seg.id === segmentId
                ? {
                    ...seg,
                    images: seg.images.map((img) =>
                      img.id === imageId ? { ...img, ...updates } : img
                    ),
                  }
                : seg
            ),
          },
        })),

      removeImageFromSegment: (segmentId, imageId) =>
        set((state) => ({
          draft: {
            ...state.draft,
            userSegments: state.draft.userSegments.map((seg) =>
              seg.id === segmentId
                ? { ...seg, images: seg.images.filter((img) => img.id !== imageId) }
                : seg
            ),
          },
        })),

      addAssistantPreset: () =>
        set((state) => ({
          draft: {
            ...state.draft,
            assistantPresets: [
              ...state.draft.assistantPresets,
              {
                id: generateId(),
                enabled: true,
                text: '',
              },
            ],
          },
        })),

      updateAssistantPreset: (id, updates) =>
        set((state) => ({
          draft: {
            ...state.draft,
            assistantPresets: state.draft.assistantPresets.map((preset) =>
              preset.id === id ? { ...preset, ...updates } : preset
            ),
          },
        })),

      removeAssistantPreset: (id) =>
        set((state) => ({
          draft: {
            ...state.draft,
            assistantPresets: state.draft.assistantPresets.filter(
              (preset) => preset.id !== id
            ),
          },
        })),

      setVariable: (key, value) =>
        set((state) => ({
          draft: {
            ...state.draft,
            variables: { ...state.draft.variables, [key]: value },
          },
        })),

      removeVariable: (key) =>
        set((state) => {
          const { [key]: _, ...rest } = state.draft.variables
          return {
            draft: { ...state.draft, variables: rest },
          }
        }),

      resetDraft: () => set({ draft: defaultDraft }),
    }),
    {
      name: 'prompt-debugger-prompt',
    }
  )
)
