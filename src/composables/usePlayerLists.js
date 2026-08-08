import { addToList, delFromList } from '@/api/user'
import { handleApiError, USER_LIST_TYPES_ENUM } from '@/constants'

export function usePlayerLists({ emit, kpId, movieInfo, notificationRef, openLogin }) {
  const getListStatus = (listType) => {
    const statusMap = {
      [USER_LIST_TYPES_ENUM.FAVORITE]: movieInfo.value?.lists?.isFavorite || false,
      [USER_LIST_TYPES_ENUM.HISTORY]: movieInfo.value?.lists?.isHistory || false,
      [USER_LIST_TYPES_ENUM.LATER]: movieInfo.value?.lists?.isLater || false,
      [USER_LIST_TYPES_ENUM.COMPLETED]: movieInfo.value?.lists?.isCompleted || false,
      [USER_LIST_TYPES_ENUM.ABANDONED]: movieInfo.value?.lists?.isAbandoned || false,
      [USER_LIST_TYPES_ENUM.WATCHING]: movieInfo.value?.lists?.isWatching || false
    }

    return statusMap[listType] ?? false
  }

  const toggleList = async (type) => {
    notificationRef.value.showNotification('Функция списков больше не поддерживается', 3000)
  }

  return {
    getListStatus,
    toggleList
  }
}
