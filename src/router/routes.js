export const routes = [
  {
    path: '/',
    component: () => import('@/components/MovieSearch.vue'),
    name: 'home',
    meta: {
      title: 'Ahaiho - Поиск фильмов'
    }
  },
  {
    path: '/top',
    component: () => import('@/components/TopMovies.vue'),
    name: 'top-movies',
    meta: {
      title: 'Ahaiho - Популярное'
    }
  },
  {
    path: '/movie/:kp_id/:slug?',
    component: () => import('@/components/MovieInfo.vue'),
    name: 'movie-info',
    meta: {
      title: 'Ahaiho - Просмотр фильма'
    }
  },
  {
    path: '/shiki/:shiki_id',
    component: () => import('@/components/MovieInfoShiki.vue'),
    name: 'movie-info-shiki',
    meta: {
      title: 'Ahaiho - Просмотр аниме'
    }
  },
  {
    path: '/contact',
    name: 'ContactsPage',
    component: () => import('@/components/ContactsPage.vue'),
    meta: {
      title: 'Ahaiho - Контакты'
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/components/Settings.vue'),
    meta: {
      title: 'Ahaiho - Настройки'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    component: () => import('@/components/NotFound.vue'),
    name: 'NotFound',
    meta: {
      title: '404 - Страница не найдена'
    }
  },
  {
    path: '/links',
    name: 'links',
    component: () => import('@/components/Links.vue'),
    meta: {
      title: 'Akaiho - Полезные ссылки'
    }
  }
]
