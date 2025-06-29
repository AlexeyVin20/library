import { useSettings } from './use-settings'

export function useViewMode() {
  const { settings, isLoaded } = useSettings()

  return {
    defaultViewMode: settings.defaultViewMode,
    preferredGenres: settings.preferredGenres,
    isLoaded
  }
} 