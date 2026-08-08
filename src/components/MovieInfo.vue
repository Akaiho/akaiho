<template>
  <div class="movie-info">
    <div class="content">
      <div v-if="(infoLoading || !movieInfo) && !errorMessage" class="content-card">
        <div class="movie-skeleton">
          <div class="movie-skeleton__header">
            <div class="movie-skeleton__title"></div>
          </div>

          <div class="movie-skeleton__ratings">
            <div class="movie-skeleton__rating-item"></div>
            <div class="movie-skeleton__rating-item"></div>
            <div class="movie-skeleton__rating-item"></div>
          </div>

          <div class="movie-skeleton__player">
            <SpinnerLoading />
          </div>

          <div class="movie-skeleton__additional-info">
            <div class="movie-skeleton__section-title"></div>
            <div class="movie-skeleton__info-list">
              <div class="movie-skeleton__info-item"></div>
              <div class="movie-skeleton__info-item"></div>
              <div class="movie-skeleton__info-item"></div>
              <div class="movie-skeleton__info-item"></div>
              <div class="movie-skeleton__info-item"></div>
            </div>
          </div>

          <div class="movie-skeleton__description">
            <div class="movie-skeleton__description-line"></div>
            <div class="movie-skeleton__description-line"></div>
            <div class="movie-skeleton__description-line"></div>
            <div class="movie-skeleton__description-line"></div>
          </div>
        </div>
      </div>

      <ErrorMessage v-if="errorMessage" :message="errorMessage" :code="errorCode" />

      <div v-if="errorMessage && clientReady" class="content-card">
        <component
          :is="moviePlayerComponent"
          v-if="clientReady && moviePlayerComponent"
          :key="kp_id"
          :kp-id="kp_id"
          :movie-info="movieInfo"
          @update:movie-info="fetchMovieInfo"
        />
      </div>

      <div v-if="movieInfo && !infoLoading" class="content-card">
        <div class="content-header">
          <div
            v-if="movieInfo.logo_url"
            class="content-logo"
            @mousemove="moveTooltip"
            @mouseleave="titleCopyTooltip = false"
            @click="copyMovieMeta"
          >
            <img :src="movieInfo.logo_url" alt="Логотип фильма" class="content-logo" />
          </div>
          <div
            v-else
            @mousemove="moveTooltip"
            @mouseleave="titleCopyTooltip = false"
            @click="copyMovieMeta"
          >
            <h1 class="content-title">
              {{ movieInfo.title }}
            </h1>
          </div>

          <div v-show="titleCopyTooltip" class="title-copy-tooltip" :style="tooltipStyle">
            Скопировать
          </div>
        </div>

        <div
          v-if="
            movieInfo.kinopoisk_id ||
            movieInfo.title ||
            movieInfo.imdb_id ||
            movieInfo.rating_imdb ||
            movieInfo.shikimori_id
          "
          class="ratings-links"
        >
          <!-- Кинопоиск -->
          <div v-if="movieInfo.kinopoisk_id">
            <a
              :href="`https://www.kinopoisk.ru/film/${movieInfo.kinopoisk_id}`"
              target="_blank"
              rel="noopener noreferrer"
              class="rating-link"
              :title="
                movieInfo.rating_kinopoisk_vote_count
                  ? `Оценок: ${formatRatingNumber(movieInfo.rating_kinopoisk_vote_count)}`
                  : 'Нет данных о количестве голосов'
              "
            >
              <img src="/src/assets/icon-kp-logo.svg" alt="КП" class="rating-logo" />
              <span class="rating-value" :class="getRatingColor(movieInfo.rating_kinopoisk)">
                {{ movieInfo.rating_kinopoisk ? movieInfo.rating_kinopoisk : '—' }}
              </span>
              <img
                src="/src/assets/icon-external-link.png"
                alt="Внешняя ссылка"
                class="external-link-icon"
              />
            </a>
          </div>

          <!-- Поиск на Кинопоиске, если нет ID -->
          <div v-if="!movieInfo.kinopoisk_id && movieInfo.title">
            <a
              :href="`https://www.kinopoisk.ru/index.php?kp_query=${encodeURIComponent(movieInfo.title + (movieInfo.year ? ' ' + movieInfo.year : ''))}`"
              target="_blank"
              rel="noopener noreferrer"
              class="rating-link"
              :title="
                movieInfo.rating_kinopoisk_vote_count
                  ? `Оценок: ${formatRatingNumber(movieInfo.rating_kinopoisk_vote_count)}`
                  : 'Нет данных о количестве голосов'
              "
            >
              <img src="/src/assets/icon-kp-logo.svg" alt="КП" class="rating-logo" />
              <span class="rating-value" :class="getRatingColor(movieInfo.rating_kinopoisk)">
                {{ movieInfo.rating_kinopoisk ? movieInfo.rating_kinopoisk : '—' }}
              </span>
              <img
                src="/src/assets/icon-external-link.png"
                alt="Внешняя ссылка"
                class="external-link-icon"
              />
            </a>
          </div>

          <!-- IMDb -->
          <div v-if="movieInfo.imdb_id">
            <a
              :href="`https://www.imdb.com/title/${movieInfo.imdb_id}`"
              target="_blank"
              rel="noopener noreferrer"
              class="rating-link"
              :title="
                movieInfo.rating_imdb_vote_count
                  ? `Оценок: ${formatRatingNumber(movieInfo.rating_imdb_vote_count)}`
                  : 'Нет данных о количестве голосов'
              "
            >
              <img src="/src/assets/icon-imdb-logo.svg" alt="IMDb" class="rating-logo" />
              <span class="rating-value" :class="getRatingColor(movieInfo.rating_imdb)">
                {{ movieInfo.rating_imdb ? movieInfo.rating_imdb : '—' }}
              </span>
              <img
                src="/src/assets/icon-external-link.png"
                alt="Внешняя ссылка"
                class="external-link-icon"
              />
            </a>
          </div>

          <!-- Поиск на IMDb, если нет ID -->
          <div v-if="!movieInfo.imdb_id && movieInfo.title">
            <a
              :href="`https://www.imdb.com/find/?q=${encodeURIComponent(movieInfo.title + (movieInfo.year ? ' ' + movieInfo.year : ''))}`"
              target="_blank"
              rel="noopener noreferrer"
              class="rating-link"
              :title="
                movieInfo.rating_imdb_vote_count
                  ? `Оценок: ${formatRatingNumber(movieInfo.rating_imdb_vote_count)}`
                  : 'Нет данных о количестве голосов'
              "
            >
              <img src="/src/assets/icon-imdb-logo.svg" alt="IMDb" class="rating-logo" />
              <span class="rating-value" :class="getRatingColor(movieInfo.rating_imdb)">
                {{ movieInfo.rating_imdb ? movieInfo.rating_imdb : '—' }}
              </span>
              <img
                src="/src/assets/icon-external-link.png"
                alt="Внешняя ссылка"
                class="external-link-icon"
              />
            </a>
          </div>

          <!-- Shikimori -->
          <div v-if="movieInfo.shikimori_id">
            <a
              :href="`https://shikimori.io/animes/${movieInfo.shikimori_id}`"
              target="_blank"
              rel="noopener noreferrer"
              class="rating-link"
              :title="`Оценок: ${movieInfo.shikimori_votes || 0}`"
            >
              <img src="/src/assets/icon-shikimori.svg" alt="Shikimori" class="rating-logo" />
              <span class="rating-value" :class="getRatingColor(movieInfo.rating_shikimori)">
                {{ Number(movieInfo.rating_shikimori)?.toFixed(1) || 'N/A' }}
              </span>
              <img
                src="/src/assets/icon-external-link.png"
                alt="Внешняя ссылка"
                class="external-link-icon"
              />
            </a>
          </div>

          <span class="action-buttons-group">
            <template v-if="movieInfo.imdb_id">
              <a
                :href="`https://www.imdb.com/title/${movieInfo.imdb_id}/parentalguide`"
                target="_blank"
                rel="noopener noreferrer"
                class="nudity-info-btn parents-guide-btn"
                title="Открыть Parents Guide на IMDb"
              >
                <span class="desktop-text">Parents Guide</span>
                <span class="mobile-text">PG</span>
                <i class="fa-regular fa-face-grin-wink"></i>
              </a>
            </template>
          </span>
        </div>

        <!-- Интеграция компонента плеера -->
        <component
          :is="moviePlayerComponent"
          v-if="clientReady && moviePlayerComponent"
          :key="kp_id"
          :kp-id="kp_id"
          :movie-info="movieInfo"
          @update:movie-info="fetchMovieInfo"
        />

        <MovieMobileListDropdown
          v-if="mainStore.isMobile"
          :movie-info="movieInfo"
          :is-in-any-list="isInAnyList"
          :expanded="isListExpanded"
          @update:expanded="isListExpanded = $event"
          @toggle-list="toggleList"
        />

        <div class="additional-info">
          <h2 class="additional-info-title">Подробнее</h2>
          <div class="info-content">
            <div v-if="moviePosterUrl" class="movie-poster-container desktop-only">
              <a
                :href="movieInfo.poster_url || moviePosterUrl"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img :src="moviePosterUrl" alt="Постер фильма" class="movie-poster" />
              </a>
            </div>
            <div class="details-container">
              <ul class="info-list">
                <li v-if="movieInfo.type && TYPES_ENUM[movieInfo.type]">
                  <strong>Тип:</strong> {{ TYPES_ENUM[movieInfo.type] }}
                </li>
                <li v-if="movieInfo.year"><strong>Год выпуска:</strong> {{ movieInfo.year }}</li>
                <li v-if="movieInfo.title"><strong>Название:</strong> {{ movieInfo.title }}</li>
                <li v-if="movieInfo.name_original">
                  <strong>Оригинальное название:</strong> {{ movieInfo.name_original }}
                </li>
                <li v-if="movieInfo.slogan"><strong>Слоган:</strong> {{ movieInfo.slogan }}</li>
                <li v-if="movieInfo.production_companies">
                  <strong>Продакшн:</strong> {{ movieInfo.production_companies }}
                </li>
                <li v-if="movieInfo.countries?.length">
                  <strong>Страна производства:</strong>
                  {{ movieInfo.countries.map((item) => item.country).join(', ') }}
                </li>
                <li v-if="movieInfo.genres?.length">
                  <strong>Жанры:</strong>
                  {{ movieInfo.genres.map((item) => item.genre).join(', ') }}
                </li>
                <li v-if="movieInfo.film_length">
                  <strong>Продолжительность:</strong> {{ formatTime(movieInfo.film_length) }}
                </li>
                <li
                  v-if="movieInfo.rating_mpaa || movieInfo.rating_age_limits"
                  class="rating-boxes"
                >
                  <div v-if="movieInfo.rating_mpaa" class="rating-box mpaa">
                    <strong>MPAA</strong>
                    <span>{{ movieInfo.rating_mpaa.toUpperCase() }}</span>
                  </div>
                  <div v-if="movieInfo.rating_age_limits" class="rating-box age">
                    <strong>{{ movieInfo.rating_age_limits.replace('age', '') }}+</strong>
                  </div>
                </li>
              </ul>
              <div class="content-info">
                <p v-if="movieInfo.description" class="content-description-text">
                  {{ movieInfo.description }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div v-if="false" class="movie-note-display">
          <div class="movie-note-header">
            <div class="movie-note-title">
              <i class="fa-solid fa-note-sticky"></i>
              <h3>Моя заметка</h3>
            </div>
            <div class="movie-note-actions">
              <button class="note-edit-btn" title="Редактировать" @click="toggleNoteEditor">
                <i class="fas fa-edit"></i>
              </button>
            </div>
          </div>
          <div class="movie-note-content">
            {{ movieNote.note_text }}
          </div>
          <div class="movie-note-footer">
            <span class="note-date">
              <i class="far fa-calendar"></i>
              Обновлено:
              {{
                new Date(movieNote.updated_at).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              }}
            </span>
          </div>
        </div>

        <div v-if="movieInfo.staff" class="staff-section">
          <div class="staff-categories">
            <div v-if="getStaffByProfession('ACTOR').length" class="staff-category">
              <h3 class="additional-info-title">Актёры</h3>
              <div class="staff-list">
                <div
                  v-for="person in getStaffByProfession('ACTOR').slice(0, 12)"
                  :key="person.staff_id"
                  class="staff-item"
                >
                  <a
                    :href="`https://www.kinopoisk.ru/name/${person.staff_id}/`"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="staff-link"
                    :title="person.description || ''"
                  >
                    <img :src="person.poster_url" :alt="person.name_ru" class="staff-photo" />
                    <span class="staff-name">{{ person.name_ru || person.name_en }}</span>
                    <span v-if="person.description" class="staff-role">{{
                      person.description
                    }}</span>
                  </a>
                </div>
                <a
                  class="expand-actors-circle-button"
                  :href="`https://www.kinopoisk.ru/film/${kp_id}/cast/`"
                  target="_blank"
                  rel="noopener noreferrer"
                  :title="`Показать всех ${getStaffByProfession('ACTOR').length} актеров`"
                >
                  +{{ getStaffByProfession('ACTOR').length - 12 }}
                </a>
              </div>
            </div>

            <div v-if="getStaffByProfession('DIRECTOR').length" class="staff-category">
              <h3 class="additional-info-title">Режиссёры</h3>
              <div class="staff-names-container">
                <div class="staff-names-list">
                  <a
                    v-for="person in getStaffByProfession('DIRECTOR').slice(0, 5)"
                    :key="person.staff_id"
                    :href="`https://www.kinopoisk.ru/name/${person.staff_id}/`"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="staff-name-link"
                  >
                    {{ person.name_ru || person.name_en }}
                  </a>
                  <a
                    v-if="getStaffByProfession('DIRECTOR').length > 5"
                    class="expand-actors-circle-button"
                    :href="`https://www.kinopoisk.ru/film/${kp_id}/cast/`"
                    target="_blank"
                    rel="noopener noreferrer"
                    :title="`Показать всех ${getStaffByProfession('DIRECTOR').length} режиссёров`"
                  >
                    +{{ getStaffByProfession('DIRECTOR').length - 5 }}
                  </a>
                </div>
              </div>
            </div>

            <div v-if="getStaffByProfession('PRODUCER').length" class="staff-category">
              <h3 class="additional-info-title">Продюсеры</h3>
              <div class="staff-names-container">
                <div class="staff-names-list">
                  <a
                    v-for="person in getStaffByProfession('PRODUCER').slice(0, 5)"
                    :key="person.staff_id"
                    :href="`https://www.kinopoisk.ru/name/${person.staff_id}/`"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="staff-name-link"
                  >
                    {{ person.name_ru || person.name_en }}
                  </a>
                  <a
                    v-if="getStaffByProfession('PRODUCER').length > 5"
                    class="expand-actors-circle-button"
                    :href="`https://www.kinopoisk.ru/film/${kp_id}/cast/`"
                    target="_blank"
                    rel="noopener noreferrer"
                    :title="`Показать всех ${getStaffByProfession('PRODUCER').length} продюсеров`"
                  >
                    +{{ getStaffByProfession('PRODUCER').length - 5 }}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Секция с сиквелами и приквелами -->
        <div v-if="sequelsAndPrequels.length" class="related-movies">
          <div class="related-movies-header">
            <h2>Сиквелы и приквелы</h2>
          </div>
          <MovieList
            :movies-list="
              showAllSequels ? sequelsAndPrequels : sequelsAndPrequels.slice(0, itemsPerRow)
            "
            :loading="false"
            :is-history="false"
            variant="related"
            class="related-movies-list"
          />
          <a
            v-if="sequelsAndPrequels.length > itemsPerRow"
            class="expand-circle-button"
            :title="`${showAllSequels ? 'Скрыть' : 'Показать все'} (${sequelsAndPrequels.length})`"
            @click="showAllSequels = !showAllSequels"
          >
            {{ showAllSequels ? '−' : `+${sequelsAndPrequels.length - itemsPerRow}` }}
          </a>
        </div>

        <!-- Секция с похожими фильмами -->
        <div v-if="similars.length" class="related-movies">
          <div class="related-movies-header">
            <h2>Похожие</h2>
          </div>
          <MovieList
            :movies-list="showAllSimilars ? similars : similars.slice(0, itemsPerRow)"
            :loading="false"
            :is-history="false"
            variant="related"
            class="related-movies-list"
          />
          <a
            v-if="similars.length > itemsPerRow"
            class="expand-circle-button"
            :title="`${showAllSimilars ? 'Скрыть' : 'Показать все'} (${similars.length})`"
            @click="showAllSimilars = !showAllSimilars"
          >
            {{ showAllSimilars ? '−' : `+${similars.length - itemsPerRow}` }}
          </a>
        </div>
      </div>
    </div>
  </div>
  <Notification ref="notificationRef" />
  <div v-if="nudityInfo !== null" class="nudity-info-popup">
    <div class="nudity-info-content">
      <div v-if="nudityInfoLoading" class="nudity-info-loading">
        <i class="fas fa-spinner fa-spin"></i>
        <span>Загрузка информации...</span>
      </div>
      <div v-else>
        {{ nudityInfo }}
      </div>
    </div>
    <div class="nudity-info-actions">
      <a
        :href="`https://www.imdb.com/title/${movieInfo.imdb_id}/parentalguide`"
        target="_blank"
        rel="noopener noreferrer"
        class="nudity-info-button"
      >
        <i class="fas fa-external-link-alt"></i>
        <span>Parents Guide</span>
      </a>
      <button class="nudity-info-button" @click="copyNudityInfo">
        <i class="fas fa-copy"></i>
        <span>Copy</span>
      </button>
      <button class="nudity-info-button" @click="openInGoogleTranslate">
        <i class="fas fa-language"></i>
        <span>Translate</span>
      </button>
    </div>
  </div>
  <MovieNoteModal
    v-if="showNoteEditor"
    v-model="noteText"
    :movie-note="movieNote"
    :is-saving="isSavingNote"
    :is-deleting="isDeletingNote"
    @close="cancelNoteEdit"
    @save="handleSaveNote"
    @delete="handleDeleteNote"
  />
  <MovieObsSettingsModal
    v-if="showObsSettings"
    v-model:enabled="obsEnabled"
    v-model:host="obsHost"
    v-model:port="obsPort"
    v-model:password="obsPassword"
    v-model:selected-filter-id="selectedFilterId"
    v-model:show-in-overlay="showObsInOverlay"
    :connected="obsConnected"
    :connecting="obsConnecting"
    :filters-found="obsFiltersFound"
    :selected-filter="selectedFilter"
    @enabled-change="handleObsEnabledChange"
    @filter-select="handleFilterSelect"
    @close="showObsSettings = false"
    @connect="handleObsConnect"
    @test-blur="handleObsTestBlur"
    @refresh-filters="handleObsRefreshFilters"
  />
</template>

<script setup>
import axios from 'axios'
import { getKpInfo, getShikiInfo, saveMovieNote } from '@/api/movies'
import { handleApiError } from '@/constants'
import { MovieList } from '@/components/MovieList/'
import ErrorMessage from '@/components/ErrorMessage.vue'
import SpinnerLoading from '@/components/SpinnerLoading.vue'
import { TYPES_ENUM } from '@/constants'
import { useBackgroundStore } from '@/store/background'
import { useMainStore } from '@/store/main'
import { useNavbarStore } from '@/store/navbar'
import { usePlayerStore } from '@/store/player'
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useHead } from '@unhead/vue'
import Notification from '@/components/notification/ToastMessage.vue'
import { getRatingColor } from '@/utils/ratingUtils'
import { buildMovieSeo, getMovieSeoEntry, getMovieSeoPath, getMovieSeoSlug } from '@/utils/movieSeo'
import { optimizePosterUrl, resolvePosterByMovie } from '@/utils/mediaUtils'

const MovieMobileListDropdown = defineAsyncComponent(
  () => import('@/components/movie/MovieMobileListDropdown.vue')
)
const MovieNoteModal = defineAsyncComponent(() => import('@/components/movie/MovieNoteModal.vue'))
const MovieObsSettingsModal = defineAsyncComponent(
  () => import('@/components/movie/MovieObsSettingsModal.vue')
)

const mainStore = useMainStore()
const backgroundStore = useBackgroundStore()
const playerStore = usePlayerStore()
const route = useRoute()
const router = useRouter()
const kp_id = ref(route.params.kp_id)
const errorMessage = ref('')
const errorCode = ref(null)
const moviePlayerComponent = ref(null)
const initialSeoEntry = getMovieSeoEntry(route.params.kp_id)
const infoLoading = ref(!initialSeoEntry)
const movieInfo = ref(
  initialSeoEntry
    ? {
        kp_id: initialSeoEntry.kp_id,
        kinopoisk_id: initialSeoEntry.kp_id,
        title: initialSeoEntry.title,
        name_ru: initialSeoEntry.title,
        year: initialSeoEntry.year,
        description: initialSeoEntry.description,
        poster_url: initialSeoEntry.poster
      }
    : null
)
const navbarStore = useNavbarStore()
const notificationRef = ref(null)
const clientReady = ref(false)

const showAllSequels = ref(false)
const showAllSimilars = ref(false)

const itemsPerRow = ref(10)

const nudityInfo = ref(null)
const nudityInfoLoading = ref(false)
const nudityInfoTrigger = ref(null)
const isListExpanded = ref(false)

const movieNote = ref(null)
const showNoteEditor = ref(false)
const noteText = ref('')
const isSavingNote = ref(false)
const isDeletingNote = ref(false)
const moviePosterUrl = computed(() => resolvePosterByMovie(movieInfo.value || {}))

const isInAnyList = computed(() => {
  return (
    movieInfo.value?.lists?.isFavorite ||
    movieInfo.value?.lists?.isWatching ||
    movieInfo.value?.lists?.isLater ||
    movieInfo.value?.lists?.isCompleted ||
    movieInfo.value?.lists?.isAbandoned
  )
})

const syncCanonicalMovieRoute = async () => {
  if (kp_id.value.startsWith('shiki') || !movieInfo.value) {
    return
  }

  const canonicalPath = getMovieSeoPath(movieInfo.value, kp_id.value)
  const targetLocation = {
    path: canonicalPath,
    query: route.query,
    hash: route.hash
  }

  const resolvedTarget = router.resolve(targetLocation)

  if (typeof window !== 'undefined') {
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`

    if (currentUrl !== resolvedTarget.href) {
      await router.replace(targetLocation)
    }
  }
}

const seoMeta = computed(() => buildMovieSeo(movieInfo.value || {}, kp_id.value))

useHead(() => {
  const seo = seoMeta.value
  const titleBase =
    movieInfo.value?.title || movieInfo.value?.name_ru || movieInfo.value?.name_original || ''

  return {
    title: seo.title,
    link: [
      {
        rel: 'canonical',
        href: seo.canonicalUrl
      }
    ],
    meta: [
      {
        name: 'description',
        content: seo.description
      },
      {
        property: 'og:type',
        content: seo.type
      },
      {
        property: 'og:title',
        content: seo.title
      },
      {
        property: 'og:description',
        content: seo.description
      },
      {
        property: 'og:url',
        content: seo.canonicalUrl
      },
      {
        property: 'og:image',
        content: seo.poster
      },
      {
        name: 'twitter:card',
        content: seo.poster ? 'summary_large_image' : 'summary'
      },
      {
        name: 'twitter:title',
        content: seo.title
      },
      {
        name: 'twitter:description',
        content: seo.description
      },
      {
        name: 'twitter:image',
        content: seo.poster
      }
    ].filter((entry) => entry.content),
    script: titleBase
      ? [
          {
            type: 'application/ld+json',
            textContent: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Movie',
              name: titleBase,
              description: seo.description,
              image: seo.poster || undefined,
              datePublished: movieInfo.value?.year || undefined,
              url: seo.canonicalUrl
            })
          }
        ]
      : []
  }
})

const formatRatingNumber = (num) => {
  if (!num) return '0'
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

const transformMoviesData = (movies) => {
  return (movies || []).map((movie) => ({
    kp_id: movie.film_id,
    poster: resolvePosterByMovie(movie),
    title: movie.name_ru || movie.name_en || movie.name_original
  }))
}

const formatTime = (minutes) => {
  if (typeof minutes !== 'number') {
    return
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours} ч. ${mins} мин.`
}

const titleCopyTooltip = ref(false)
const tooltipStyle = ref({ top: '0px', left: '0px' })
const moveTooltip = (event) => {
  titleCopyTooltip.value = true
  tooltipStyle.value = {
    top: `${event.pageY + 10}px`,
    left: `${event.pageX - 70}px`
  }
}

const copyMovieMeta = async () => {
  try {
    const movieMeta = [
      movieInfo.value.name_ru || movieInfo.value.name_en || movieInfo.value.name_original,
      ...(movieInfo.value.year ? [movieInfo.value.year] : []),
      ...(movieInfo.value.film_length ? [formatTime(movieInfo.value.film_length)] : [])
    ]
    await navigator.clipboard.writeText(movieMeta.join(', '))
    notificationRef.value.showNotification('Скопировано')
  } catch (err) {
    console.error('Ошибка копирования:', err)
  }
}

const fetchShikiRating = async (title, year, kind = 'tv') => {
  if (!title) return null
  try {
    const searchUrl = `https://shikimori.io/api/animes?search=${encodeURIComponent(title)}&limit=10`
    const searchRes = await axios.get(searchUrl)

    if (!searchRes.data?.length) return null

    // Extract year from aired_on date
    const getYear = (anime) => {
      if (anime.aired_on) return parseInt(anime.aired_on.split('-')[0])
      if (anime.released_on) return parseInt(anime.released_on.split('-')[0])
      return null
    }

    // Find best match
    let bestCandidate = null

    // 1. Exact year + kind match
    if (year) {
      bestCandidate = searchRes.data.find((anime) => getYear(anime) === year && anime.kind === kind)
    }

    // 2. Exact year match (any kind)
    if (!bestCandidate && year) {
      bestCandidate = searchRes.data.find((anime) => getYear(anime) === year)
    }

    // 3. Kind match (prefer tv, fallback to movie)
    if (!bestCandidate) {
      bestCandidate = searchRes.data.find((anime) => anime.kind === kind)
    }
    if (!bestCandidate) {
      bestCandidate = searchRes.data.find((anime) => anime.kind === 'movie')
    }

    // 4. First result
    if (!bestCandidate) {
      bestCandidate = searchRes.data[0]
    }

    if (!bestCandidate) return null

    const fullRes = await axios.get(`https://shikimori.io/api/animes/${bestCandidate.id}`)
    const fullData = fullRes.data
    const totalVotes =
      fullData.rates_scores_stats?.reduce((sum, stat) => sum + (stat.value || 0), 0) || 0

    return {
      shikimori_id: fullData.id,
      rating_shikimori: fullData.score,
      shikimori_votes: totalVotes
    }
  } catch (error) {
    console.warn('Shikimori fetch failed:', error)
    return null
  }
}

const fetchMovieInfo = async (updateHistory = true) => {
  try {
    let response
    if (kp_id.value.startsWith('shiki')) {
      response = await getShikiInfo(kp_id.value)
    } else {
      response = await getKpInfo(kp_id.value)
    }

    if (Array.isArray(response) && response.length === 0) {
      throw new Error('Данные не найдены. Пожалуйста, повторите поиск.')
    }

    movieInfo.value = response

    if (kp_id.value.startsWith('shiki')) {
      movieInfo.value = {
        ...movieInfo.value,
        title: movieInfo.value.name_ru || movieInfo.value.name_en,
        name_original: movieInfo.value.name_en,
        short_description: movieInfo.value.slogan
      }
    } else {
      movieInfo.value = {
        ...movieInfo.value,
        title: movieInfo.value.name_ru || movieInfo.value.name_en || movieInfo.value.name_original,
        kinopoisk_id: kp_id.value
      }
    }

    navbarStore.setHeaderContent({
      text: movieInfo.value.title,
      imageUrl: movieInfo.value.logo_url
    })

    await syncCanonicalMovieRoute()

    const movieToSave = {
      kp_id: kp_id.value,
      title: movieInfo.value?.name_ru || movieInfo.value?.name_en || movieInfo.value?.name_original,
      slug: getMovieSeoSlug(movieInfo.value, kp_id.value),
      poster:
        optimizePosterUrl(movieInfo.value?.poster_url) ||
        optimizePosterUrl(movieInfo.value?.cover_url) ||
        optimizePosterUrl(movieInfo.value?.screenshots?.[0]),
      year: movieInfo.value?.year,
      type: movieInfo.value?.type
    }

    // Устанавливаем фон фильма через новый метод
    if (kp_id.value.startsWith('shiki')) {
      if (movieInfo.value.screenshots && movieInfo.value.screenshots.length > 0) {
        const randomIndex = Math.floor(Math.random() * movieInfo.value.screenshots.length)
        const randomScreenshot = movieInfo.value.screenshots[randomIndex]
        backgroundStore.updateMoviePoster(randomScreenshot)
      } else if (movieToSave.poster) {
        backgroundStore.updateMoviePoster(movieToSave.poster)
      }
    } else {
      if (movieToSave.poster) {
        backgroundStore.updateMoviePoster(movieToSave.poster)
      }
    }

    const isHistoryAllowed = computed(() => mainStore.isHistoryAllowed)

    if (isHistoryAllowed.value && movieToSave.kp_id && movieToSave.title && updateHistory) {
      mainStore.addToHistory({ ...movieToSave })
    }

    // Load Shikimori rating for KP movies (direct API) - only for anime
    const isAnime = movieInfo.value.genres?.some(
      (g) => g.genre?.toLowerCase() === 'аниме' || g.genre?.toLowerCase() === 'animation'
    )
    if (!kp_id.value.startsWith('shiki') && isAnime) {
      const shikiKind = movieInfo.value.film_length ? 'movie' : 'tv'
      const shikiYear = Number.parseInt(movieInfo.value.year, 10) || null
      const shikiData = await fetchShikiRating(
        movieInfo.value.title || movieInfo.value.name_ru,
        shikiYear,
        shikiKind
      )
      if (shikiData) {
        Object.assign(movieInfo.value, shikiData)
      }
    }
  } catch (error) {
    const { message, code } = handleApiError(error)
    errorMessage.value = message
    errorCode.value = code
    console.error('Ошибка при загрузке информации о фильмах:', error)
  }
}

const sequelsAndPrequels = computed(() =>
  transformMoviesData(movieInfo.value?.sequels_and_prequels)
)

const similars = computed(() => transformMoviesData(movieInfo.value?.similars))

const updateItemsPerRow = () => {
  const containerWidth = document.querySelector('.related-movies')?.clientWidth || 0
  const itemWidth = 140 + 20
  const newItemsPerRow = Math.floor(containerWidth / itemWidth) || 10
  itemsPerRow.value = Math.max(1, newItemsPerRow)
}

const onResize = () => {
  updateItemsPerRow()
}

const onKeyDown = (event) => {
  if (event.altKey && event.keyCode === 84) {
    const playerComponent = document.querySelector('.player-container')
    if (playerComponent) {
      const theaterModeBtn = document.querySelector('.theater-mode-btn')
      if (theaterModeBtn) {
        theaterModeBtn.click()
      }
    }
  }
}

const toggleList = async () => {
  notificationRef.value.showNotification('Функция списков больше не поддерживается', 3000)
}

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
  const dropdown = document.querySelector('.mobile-list-dropdown')
  if (dropdown && !dropdown.contains(event.target)) {
    isListExpanded.value = false
  }
}

const handleNudityPopupOutsideClick = (event) => {
  const popup = document.querySelector('.nudity-info-popup')
  if (
    popup &&
    !popup.contains(event.target) &&
    nudityInfoTrigger.value &&
    !nudityInfoTrigger.value.contains(event.target)
  ) {
    nudityInfo.value = null
  }
}

onMounted(async () => {
  clientReady.value = true
  moviePlayerComponent.value = (await import('@/components/PlayerComponent.vue')).default
  await fetchMovieInfo()
  infoLoading.value = false
  document.addEventListener('keydown', onKeyDown)
  window.addEventListener('resize', onResize)
  setTimeout(updateItemsPerRow, 100)
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('click', handleNudityPopupOutsideClick, true)
})

onUnmounted(async () => {
  navbarStore.clearHeaderContent()
  document.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('resize', onResize)
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('click', handleNudityPopupOutsideClick, true)
})

watch(
  () => route.params.kp_id,
  async (newKpId) => {
    if (newKpId && newKpId !== kp_id.value) {
      navbarStore.clearHeaderContent()
      kp_id.value = newKpId
      await fetchMovieInfo()
      infoLoading.value = false
    }
  },
  { immediate: true }
)

watch(
  nudityInfo,
  (newValue) => {
    if (newValue) {
      document.addEventListener('click', handleNudityPopupOutsideClick, true)
    } else {
      document.removeEventListener('click', handleNudityPopupOutsideClick, true)
    }
  },
  { deep: true }
)

onMounted(() => {
  const checkObsSources = setInterval(() => {
    if (window.obsSources && Array.isArray(window.obsSources)) {
      obsSources.value = window.obsSources
    }

    if (window.getOBSFiltersInfo) {
      const filtersInfo = window.getOBSFiltersInfo()
      if (filtersInfo && Array.isArray(filtersInfo)) {
        playerStore.updateObsSettings({ filtersFound: filtersInfo })
      }
    }
  }, 1000)

  onUnmounted(() => {
    clearInterval(checkObsSources)
  })
})

onUnmounted(() => {})

const getStaffByProfession = (profession) => {
  return movieInfo.value?.staff?.filter((person) => person.profession_key === profession) || []
}

const copyNudityInfo = async () => {
  try {
    await navigator.clipboard.writeText(nudityInfo.value)
    notificationRef.value.showNotification('Текст скопирован')
  } catch (err) {
    console.error('Ошибка копирования:', err)
    notificationRef.value.showNotification('Ошибка при копировании текста')
  } finally {
    nudityInfo.value = null
  }
}

const openInGoogleTranslate = () => {
  const text = encodeURIComponent(nudityInfo.value)
  window.open(`https://translate.google.com/?sl=en&tl=ru&text=${text}`, '_blank')
  nudityInfo.value = null
}

const toggleNoteEditor = () => {
  notificationRef.value.showNotification('Заметки больше не поддерживаются')
}

const handleSaveNote = async () => {
  if (!noteText.value.trim()) {
    notificationRef.value.showNotification('Заметка не может быть пустой')
    return
  }

  if (noteText.value.length > 10000) {
    notificationRef.value.showNotification('Заметка слишком длинная (максимум 10000 символов)')
    return
  }

  try {
    isSavingNote.value = true
    const response = await saveMovieNote(kp_id.value, noteText.value)
    movieNote.value = response.note
    noteText.value = response.note.note_text
    notificationRef.value.showNotification('Заметка сохранена')
    showNoteEditor.value = false
  } catch (error) {
    const { message } = handleApiError(error)
    notificationRef.value.showNotification(message, 5000)
  } finally {
    isSavingNote.value = false
  }
}

const handleDeleteNote = async () => {
  notificationRef.value.showNotification('Заметки больше не поддерживаются')
}

const cancelNoteEdit = () => {
  if (movieNote.value) {
    noteText.value = movieNote.value.note_text
  } else {
    noteText.value = ''
  }
  showNoteEditor.value = false
}

// OBS Settings
const showObsSettings = ref(false)
const obsConnecting = ref(false)

const obsEnabled = computed({
  get: () => playerStore.obsSettings.enabled,
  set: (value) => playerStore.updateObsSettings({ enabled: value })
})

const obsHost = computed({
  get: () => playerStore.obsSettings.host,
  set: (value) => playerStore.updateObsSettings({ host: value })
})

const obsPort = computed({
  get: () => playerStore.obsSettings.port,
  set: (value) => playerStore.updateObsSettings({ port: value })
})

const obsPassword = computed({
  get: () => playerStore.obsSettings.password,
  set: (value) => playerStore.updateObsSettings({ password: value })
})

const obsConnected = computed(() => playerStore.obsSettings.connected)
const obsSources = ref([])
const obsFiltersFound = computed(() => playerStore.obsSettings.filtersFound)

const selectedFilterId = computed({
  get: () => playerStore.obsSettings.selectedFilterId,
  set: (value) => playerStore.setObsSelectedFilter(value)
})

const selectedFilter = computed(() => {
  if (!selectedFilterId.value) return null
  return obsFiltersFound.value.find((filter) => filter.id === selectedFilterId.value)
})

const showObsInOverlay = computed({
  get: () => playerStore.obsSettings.showObsInOverlay,
  set: (value) => playerStore.updateObsSettings({ showObsInOverlay: value })
})

// OBS Functions
const handleObsEnabledChange = () => {
  if (obsEnabled.value) {
    handleObsConnect()
  }
}

const handleObsConnect = async () => {
  if (obsConnecting.value) return

  obsConnecting.value = true
  try {
    if (window.connectToOBS) {
      await window.connectToOBS()
      setTimeout(() => {
        if (window.obsSources) {
          obsSources.value = window.obsSources
        }
      }, 1000)
      notificationRef.value?.showNotification('Подключение к OBS...')
    } else {
      notificationRef.value?.showNotification('Плеер не загружен')
    }
  } catch (error) {
    console.error('Error connecting to OBS:', error)
    notificationRef.value?.showNotification('Ошибка подключения к OBS')
  } finally {
    obsConnecting.value = false
  }
}

const handleObsTestBlur = () => {
  if (!selectedFilterId.value) {
    notificationRef.value?.showNotification('Выберите фильтр для тестирования')
    return
  }

  if (window.testOBSBlur) {
    window.testOBSBlur(selectedFilterId.value)
  } else {
    notificationRef.value?.showNotification('OBS функции недоступны')
  }
}

const handleObsRefreshFilters = () => {
  if (window.refreshOBSFilters) {
    window.refreshOBSFilters()
    notificationRef.value?.showNotification('Поиск фильтров...')
  } else {
    notificationRef.value?.showNotification('OBS функции недоступны')
  }
}

const handleFilterSelect = () => {
  if (selectedFilterId.value) {
    notificationRef.value?.showNotification(`Выбран фильтр: ${selectedFilter.value?.sourceName}`)
  }
}
</script>

<style scoped>
.content {
  min-height: 100vh;
}
/* Стили для информации о фильме */
.content-card {
  overflow: hidden;
  padding: 20px;
  color: #e0e0e0;
}

.content-header {
  height: 80px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-wrap: wrap;
  height: auto;
  min-height: 80px;
}

.content-logo {
  max-height: 80px;
  height: 80px;
  width: auto;
  object-fit: contain;
  max-width: 100%;
  transition: all 0.3s ease;
  cursor: pointer;
  padding: 10px 0 30px;
}

.content-logo:hover {
  filter: drop-shadow(0 0 10px var(--accent-color));
}

.content-title-container {
  display: flex;
  align-items: center;
  gap: 20px;
  width: 100%;
  justify-content: center;
}

.movie-poster-thumbnail {
  width: 60px;
  height: 90px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s ease;
}

.movie-poster-thumbnail:hover {
  transform: scale(1.05);
}

.movie-poster-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.content-title {
  font-size: 55px;
  margin: 0;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  text-align: center;
  white-space: normal;
  width: 100%;
  text-align: center;
  white-space: normal;
  word-break: break-word;
  overflow-wrap: anywhere;
  transition: all 0.3s ease;
  cursor: pointer;
}

.content-title:hover {
  text-shadow: 0 0 20px var(--accent-color);
  color: var(--accent-color);
}

.content-subtitle {
  font-size: 20px;
  color: #bbb;
}

.ratings-links {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin: 15px 0;
}

.action-buttons-group {
  display: inline-flex;
  align-items: center;
  gap: 15px;
}

.action-buttons-group .mobile-text {
  display: none;
}

.rating-link {
  display: inline-flex;
  align-items: center;
  color: #fff;
  text-decoration: none;
  font-weight: bold;
  background: rgba(0, 0, 0, 0.7);
  padding: 5px 10px;
  border-radius: 5px;
  gap: 5px;
  transition: all 0.2s ease;
  vertical-align: middle;
}

.rating-link:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--accent-color);
  box-shadow: 0 0 10px var(--accent-semi-transparent);
}

.rating-logo {
  width: 20px;
  height: 20px;
  margin-right: 5px;
}

.external-link-icon {
  width: 20px;
  height: auto;
  margin-left: 5px;
}

.additional-info {
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 16px;
}

.additional-info-title {
  margin: 15px 0 15px;
  text-align: left;
  color: #fff;
}

.info-content {
  display: flex;
  gap: 15px;
  align-items: flex-start;
}

.movie-poster-container {
  flex-shrink: 0;
  width: 200px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s ease;
}

.movie-poster-container:hover {
  transform: scale(1.02);
  box-shadow: 0 6px 20px var(--accent-semi-transparent);
}

.movie-poster {
  width: 100%;
  height: auto;
  display: block;
}

.details-container {
  flex: 1;
  min-width: 0;
}

.info-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.info-list li {
  margin-bottom: 8px;
}

.content-info {
  font-size: 16px;
  line-height: 1.6;
  color: #ccc;
  margin-top: 20px;
}

.content-description-text {
  margin: 0;
  white-space: pre-wrap;
}

.error-message {
  color: var(--accent-color);
  text-align: center;
  padding: 20px;
  font-size: 1.2rem;
  border: 1px solid var(--accent-color);
  border-radius: 5px;
  margin: 20px auto;
  max-width: 500px;
  background: var(--accent-transparent);
}

/* Стили для секций с похожими фильмами */
.related-movies {
  margin-top: 30px;
  padding: 18px 18px 12px;
  border-radius: 18px;
  position: relative;
  background: rgba(8, 12, 10, 0.34);
  border: 1px solid rgba(81, 207, 102, 0.16);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

.related-movies-header {
  position: relative;
  z-index: 1;
  margin-bottom: 14px;
}

.related-movies h2 {
  color: #fff;
  margin: 0;
  font-size: 1.35rem;
  line-height: 1.1;
  letter-spacing: -0.02em;
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.related-movies h2::before {
  content: '';
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #51cf66;
  box-shadow: 0 0 10px rgba(81, 207, 102, 0.45);
}

/* Подсказка */
.title-copy-tooltip {
  position: absolute;
  background-color: #333;
  color: #fff;
  padding: 5px 10px;
  border-radius: 5px;
  font-size: 14px;
  white-space: nowrap;
  pointer-events: none;
}

@media (max-width: 600px) {
  .content-card {
    padding: 0 2px;
  }

  .content-header,
  .content-logo,
  .content-title {
    display: none;
  }

  .content-subtitle {
    font-size: 16px;
  }

  .ratings-links {
    margin: 5px 0;
    gap: 8px;
    flex-wrap: wrap;
  }

  .rating-link {
    padding: 3px 6px;
    font-size: 14px;
  }

  .rating-logo {
    width: 16px;
    height: 16px;
    margin-right: 3px;
  }

  .external-link-icon {
    width: 16px;
    margin-left: 3px;
  }

  .action-buttons-group {
    width: 100%;
    justify-content: center;
    gap: 10px;
    margin-top: 10px;
  }

  .action-buttons-group .nudity-info-btn {
    background: rgba(0, 0, 0, 0.7);
    padding: 12px 16px;
    border-radius: 8px;
    min-height: 44px;
    font-size: 14px;
  }

  .action-buttons-group .mobile-text {
    display: inline;
  }

  .action-buttons-group .desktop-text {
    display: none;
  }

  .action-buttons-group .nudity-info-btn i {
    font-size: 18px;
  }

  .additional-info-title {
    font-size: 20px;
  }

  .info-content {
    flex-direction: column;
    align-items: center;
  }

  .content-title-container {
    flex-direction: column;
    gap: 10px;
  }

  .movie-poster-thumbnail {
    width: 50px;
    height: 75px;
  }
}

.controls {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 40px;
  border-radius: 10px;
}

.controls button {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #444;
  color: #fff;
  border: none;
  padding: 12px;
  font-size: 18px;
  border-radius: 8px;
  cursor: pointer;
  transition:
    background-color 0.3s ease,
    transform 0.2s ease,
    box-shadow 0.3s ease;
  z-index: 4;
  width: 50px;
  height: 50px;
}

.controls button:hover {
  background-color: var(--accent-color);
  transform: translateY(-3px);
  box-shadow: 0 4px 10px var(--accent-semi-transparent);
}

.controls button:active {
  transform: translateY(0);
  box-shadow: none;
}

.controls button.active {
  background-color: var(--accent-color);
  box-shadow: 0 0 10px var(--accent-semi-transparent);
}

.material-icons {
  font-size: 24px;
}

.tooltip-container {
  position: relative;
  display: inline-block;
}

.custom-tooltip {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: #333;
  color: #fff;
  padding: 5px;
  border-radius: 4px;
  font-size: 16px;
  white-space: nowrap;
  margin-top: 8px;
  pointer-events: none;
  text-align: center;
}

.advanced-tooltip {
  white-space: normal;
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  top: calc(100% + 5px);
  pointer-events: all;
  text-align: center;
}

.tooltip-title {
  font-size: 16px;
  text-align: center;
}

.movie-skeleton {
  padding: 0 20px 20px;
  color: #e0e0e0;
}

.movie-skeleton__header {
  height: 80px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.movie-skeleton__logo {
  width: 200px;
  height: 80px;
  background: linear-gradient(
    90deg,
    rgba(30, 30, 30, 0.9) 0%,
    rgba(50, 50, 50, 0.9) 50%,
    rgba(30, 30, 30, 0.9) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 2s infinite linear;
  border-radius: 8px;
}

.movie-skeleton__title {
  width: 30%;
  height: 40px;
  background: linear-gradient(
    90deg,
    rgba(40, 40, 40, 0.8) 0%,
    rgba(60, 60, 60, 0.8) 50%,
    rgba(40, 40, 40, 0.8) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 2s infinite linear;
  border-radius: 12px;
  margin: 0 auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;
}

.movie-skeleton__title::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.05) 50%,
    transparent 100%
  );
  animation: shine 1.5s infinite;
}

@keyframes shine {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.movie-skeleton__ratings {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin: 15px 0;
}

.movie-skeleton__rating-item {
  width: 120px;
  height: 30px;
  background: linear-gradient(
    90deg,
    rgba(30, 30, 30, 0.9) 0%,
    rgba(50, 50, 50, 0.9) 50%,
    rgba(30, 30, 30, 0.9) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 2s infinite linear;
  border-radius: 8px;
}

.movie-skeleton__player {
  width: 60%;
  height: 500px;
  background-size: 200% 100%;
  animation: shimmer 2s infinite linear;
  border-radius: 12px;
  margin: 20px auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.movie-skeleton__player::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top: 4px solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  100% {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

.movie-skeleton__additional-info {
  margin: 20px 0;
}

.movie-skeleton__section-title {
  width: 150px;
  height: 24px;
  background: linear-gradient(
    90deg,
    rgba(30, 30, 30, 0.9) 0%,
    rgba(50, 50, 50, 0.9) 50%,
    rgba(30, 30, 30, 0.9) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 2s infinite linear;
  border-radius: 8px;
  margin-bottom: 15px;
}

.movie-skeleton__info-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.movie-skeleton__info-item {
  width: 100%;
  height: 20px;
  background: linear-gradient(
    90deg,
    rgba(30, 30, 30, 0.9) 0%,
    rgba(50, 50, 50, 0.9) 50%,
    rgba(30, 30, 30, 0.9) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 2s infinite linear;
  border-radius: 8px;
}

.movie-skeleton__description {
  margin: 20px 0;
}

.movie-skeleton__description-line {
  width: 100%;
  height: 16px;
  background: linear-gradient(
    90deg,
    rgba(30, 30, 30, 0.9) 0%,
    rgba(50, 50, 50, 0.9) 50%,
    rgba(30, 30, 30, 0.9) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 2s infinite linear;
  border-radius: 8px;
  margin-bottom: 10px;
}

.movie-skeleton__description-line:nth-child(2) {
  width: 90%;
}

.movie-skeleton__description-line:nth-child(3) {
  width: 95%;
}

.movie-skeleton__description-line:nth-child(4) {
  width: 85%;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

@media (max-width: 600px) {
  .movie-skeleton {
    padding: 10px;
  }

  .movie-skeleton__header {
    height: 60px;
  }

  .movie-skeleton__logo {
    width: 150px;
    height: 60px;
  }

  .movie-skeleton__title {
    width: 70%;
    height: 30px;
  }

  .movie-skeleton__player {
    height: 250px;
  }

  .movie-skeleton__rating-item {
    width: 80px;
    height: 25px;
  }

  .movie-skeleton__control-btn {
    width: 40px;
    height: 40px;
  }
}

.staff-section {
  border-radius: 8px;
}

.staff-categories {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.staff-category h3 {
  color: #fff;
  margin-bottom: 10px;
  font-size: 18px;
}

.staff-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 15px;
  align-items: start;
  margin-bottom: 10px;
}

.staff-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  height: 100%;
}

.staff-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s;
  height: 100%;
}

.staff-link:hover {
  transform: translateY(-3px);
  filter: drop-shadow(0 4px 8px var(--accent-semi-transparent));
}

.staff-photo {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 8px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.staff-link:hover .staff-photo {
  border-color: var(--accent-color);
  box-shadow: 0 0 12px var(--accent-semi-transparent);
}

.staff-name {
  font-size: 14px;
  color: #fff;
  margin-bottom: 4px;
  min-height: 2.8em;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0 4px;
}

.staff-role {
  font-size: 12px;
  color: #aaa;
  min-height: 1.8em;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0 4px;
}

@media (max-width: 600px) {
  .staff-list {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }

  .staff-photo {
    width: 60px;
    height: 60px;
  }

  .staff-name {
    font-size: 12px;
    min-height: 2.4em;
  }

  .staff-role {
    font-size: 10px;
    min-height: 1.6em;
  }
}

.show-all-link {
  display: inline-block;
  color: #aaa;
  text-decoration: none;
  margin-top: 10px;
  cursor: pointer;
  transition: color 0.2s;
}

.show-all-link:hover {
  color: #fff;
  text-decoration: underline;
}
.expand-actors-circle-button {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #fff;
  font-size: 24px;
  text-decoration: none;
  flex-shrink: 0;
}

.expand-circle-button {
  position: absolute;
  top: 0;
  right: 15px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #fff;
  font-size: 20px;
  text-decoration: none;
}

.expand-circle-button:hover {
  background: var(--accent-color);
  transform: scale(1.05);
  box-shadow: 0 4px 12px var(--accent-semi-transparent);
}

@media (max-width: 600px) {
  .expand-circle-button {
    width: 35px;
    height: 35px;
    font-size: 16px;
  }
}

.show-more-btn {
  display: block;
  margin: 15px auto;
  padding: 8px 16px;
  background: #3a3a3a;
  color: #fff;
  border: 1px solid #505050;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.show-more-btn:hover {
  background: var(--accent-color);
  border-color: var(--accent-color);
  box-shadow: 0 4px 8px var(--accent-semi-transparent);
}

.show-more-btn:active {
  background: var(--accent-color);
  border-color: var(--accent-color);
}

.nudity-info-btn {
  position: relative;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: inherit;
  font: inherit;
  display: flex;
  align-items: center;
  gap: 5px;
}

.nudity-info-btn:hover i {
  color: var(--accent-color);
}

.nudity-info-btn:hover,
.parents-guide-btn:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  border-color: var(--accent-color) !important;
  box-shadow: 0 0 10px var(--accent-semi-transparent) !important;
}

.parents-guide-btn {
  background: rgba(0, 0, 0, 0.7);
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.parents-guide-btn i {
  margin-left: 5px;
}

.nudity-info-btn i {
  font-size: 20px;
  color: #fff;
}

.nudity-info-btn .fa-spinner {
  color: #fff;
}

.nudity-info-popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.95);
  border: 1px solid #333;
  border-radius: 8px;
  padding: 20px;
  min-width: 900px;
  max-width: 1500px;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.nudity-info-content {
  color: #fff;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  margin-bottom: 15px;
  max-height: 80vh;
  overflow-y: auto;
}

.nudity-info-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
  padding: 20px;
  color: #fff;
}

.nudity-info-loading i {
  font-size: 20px;
  color: var(--accent-color);
}

.nudity-info-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-start;
  margin-top: 10px;
}

.nudity-info-button {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 4px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  pointer-events: all;
}

.nudity-info-button:hover {
  background: var(--accent-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px var(--accent-semi-transparent);
}

.nudity-info-button i {
  font-size: 16px;
}

@media (max-width: 600px) {
  .nudity-info-popup {
    min-width: 300px;
    max-width: 95vw;
    margin: 0 10px;
  }
}

.staff-names-container {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  margin-bottom: 15px;
  width: 100%;
}

.staff-names-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  flex: 1;
  min-width: 0;
  align-items: center;
}

.staff-name-link {
  color: #fff;
  text-decoration: none;
  padding: 5px 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.staff-name-link:hover {
  background: var(--accent-color);
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px var(--accent-semi-transparent);
}

.staff-list .expand-actors-circle-button {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #fff;
  font-size: 24px;
  text-decoration: none;
  flex-shrink: 0;
}

.staff-list .expand-actors-circle-button:hover {
  background: var(--accent-color);
  transform: scale(1.05);
  box-shadow: 0 4px 12px var(--accent-semi-transparent);
}

.staff-names-list .expand-actors-circle-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #fff;
  font-size: 16px;
  text-decoration: none;
  flex-shrink: 0;
}

.staff-names-list .expand-actors-circle-button:hover {
  background: var(--accent-color);
  transform: scale(1.05);
  box-shadow: 0 4px 12px var(--accent-semi-transparent);
}

@media (max-width: 600px) {
  .staff-names-container {
    flex-direction: row;
    align-items: flex-start;
    gap: 10px;
  }

  .staff-names-list {
    width: auto;
    flex: 1;
  }

  .staff-name-link {
    font-size: 14px;
    padding: 4px 8px;
  }

  .staff-list .expand-actors-circle-button {
    width: 60px;
    height: 60px;
    font-size: 20px;
  }

  .staff-names-list .expand-actors-circle-button {
    width: 35px;
    height: 35px;
    font-size: 14px;
  }
}

.related-movies-list :deep(.grid) {
  position: relative;
  z-index: 1;
  grid-template-columns: repeat(auto-fill, minmax(156px, 1fr));
  align-items: start;
  gap: 14px;
  padding: 0;
}

.related-movies-list :deep(.grid.card-size-small) {
  grid-template-columns: repeat(auto-fill, minmax(132px, 1fr));
  gap: 10px;
}

.related-movies-list :deep(.grid.card-size-medium) {
  grid-template-columns: repeat(auto-fill, minmax(156px, 1fr));
}

.related-movies-list :deep(.grid.card-size-large) {
  grid-template-columns: repeat(auto-fill, minmax(172px, 1fr));
  gap: 14px;
}

.related-movies .expand-circle-button {
  position: relative;
  z-index: 1;
  margin-top: 18px;
}

@media (max-width: 620px) {
  .related-movies {
    margin-top: 24px;
    padding: 14px 10px 10px;
    border-radius: 14px;
  }

  .related-movies h2 {
    font-size: 1.15rem;
  }

  .related-movies-list :deep(.grid) {
    grid-template-columns: 1fr;
    gap: 10px;
  }
}

@media (max-width: 768px) {
  .info-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .desktop-only {
    display: none;
  }
}

.rating-value.low {
  color: #ff6b6b !important;
}

.rating-value.medium {
  color: #ffd93d !important;
}

.rating-value.high {
  color: #51cf66 !important;
}

.desktop-text {
  display: inline;
}

.mobile-text {
  display: none;
}

@media (max-width: 600px) {
  .desktop-text {
    display: none;
  }

  .mobile-text {
    display: inline;
  }
}

.rating-boxes {
  display: flex;
  gap: 10px;
  margin: 10px 0;
}

.rating-box {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: bold;
  gap: 5px;
}

.rating-box.mpaa {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.rating-box.mpaa span {
  font-size: 0.9em;
}

.rating-box.age {
  background: rgba(255, 0, 0, 0.1);
  border: 1px solid rgba(255, 0, 0, 0.3);
}

.rating-box strong {
  font-size: 0.9em;
  opacity: 0.8;
}

.rating-box span {
  font-size: 1.1em;
}

@media (max-width: 600px) {
  .rating-boxes {
    flex-wrap: wrap;
  }

  .rating-box {
    font-size: 14px;
    padding: 3px 6px;
  }
}

.obs-modal-content {
  max-width: 600px;
  width: 90%;
  max-height: 85vh;
  overflow-y: auto;
  padding: 15px;
  box-sizing: border-box;
}

.obs-settings-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 0;
}

.obs-setting-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.obs-setting-group:last-child {
  margin-bottom: 0;
}

.obs-checkbox-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  color: #fff;
}

.obs-checkbox-label input[type='checkbox'] {
  width: 18px;
  height: 18px;
  accent-color: #ff6b35;
}

.obs-setting-description {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 6px;
  line-height: 1.3;
}

.obs-connection-settings {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 15px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.obs-setting-group label {
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 6px;
}

.obs-input,
.obs-select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 14px;
  transition: all 0.3s ease;
  margin-bottom: 6px;
  box-sizing: border-box;
}

.obs-input:focus,
.obs-select:focus {
  outline: none;
  border-color: #ff6b35;
  box-shadow: 0 0 0 2px rgba(255, 107, 53, 0.2);
}

.obs-range {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.2);
  outline: none;
  accent-color: #ff6b35;
}

.obs-status {
  padding: 12px 16px;
  border-radius: 8px;
  text-align: center;
  font-weight: 500;
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
  border: 1px solid rgba(244, 67, 54, 0.3);
}

.obs-status.connected {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.obs-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}

.obs-action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
  min-width: 140px;
  justify-content: center;
}

.obs-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.connect-btn {
  background: linear-gradient(135deg, #9c27b0, #7b1fa2);
  color: white;
}

.connect-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #8e24aa, #6a1b9a);
  transform: translateY(-1px);
}

.test-btn {
  background: linear-gradient(135deg, #2196f3, #0b7dda);
  color: white;
}

.test-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #1976d2, #0b6cb7);
  transform: translateY(-1px);
}

.refresh-btn {
  background: linear-gradient(135deg, #ff9800, #e68900);
  color: white;
}

.refresh-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #f57c00, #bf6900);
  transform: translateY(-1px);
}

.obs-warning {
  padding: 12px;
  background: rgba(255, 152, 0, 0.2);
  color: #ff9800;
  border: 1px solid rgba(255, 152, 0, 0.3);
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.4;
}

.obs-filters-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.obs-filter-selection {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.obs-filter-select {
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  outline: none;
  transition: all 0.3s ease;
}

.obs-filter-select:focus {
  border-color: var(--accent-color);
  box-shadow: 0 0 5px var(--accent-semi-transparent);
}

.obs-filter-select option {
  background: #2a2a2a;
  color: #fff;
}

.selected-filter-info {
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-details {
  font-size: 14px;
  color: #fff;
  text-align: center;
}

.filter-status {
  font-size: 13px;
  color: #f44336;
  font-weight: 500;
  text-align: center;
}

.filter-status.enabled {
  color: #4caf50;
}

.obs-info {
  padding: 10px 12px;
  background: rgba(76, 175, 80, 0.1);
  border: 1px solid rgba(76, 175, 80, 0.3);
  border-radius: 6px;
  color: #4caf50;
  font-size: 13px;
  text-align: center;
}

@media (max-width: 600px) {
  .obs-button {
    display: none !important;
  }

  .obs-actions {
    flex-direction: column;
  }

  .obs-action-btn {
    min-width: unset;
  }
}

.note-btn {
  transition: all 0.3s ease;
}

.note-btn.has-note {
  color: #ffd700;
  animation: pulse-note 2s infinite;
}

.note-btn.has-note i {
  color: #ffd700;
  filter: drop-shadow(0 0 3px rgba(255, 215, 0, 0.5));
}

@keyframes pulse-note {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.movie-note-display {
  margin: 30px 0;
  padding: 20px;
  background: linear-gradient(135deg, rgba(255, 107, 53, 0.05) 0%, rgba(255, 107, 53, 0.02) 100%);
  border: 2px solid rgba(255, 107, 53, 0.2);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.movie-note-display:hover {
  box-shadow: 0 6px 16px rgba(255, 107, 53, 0.15);
  transform: translateY(-2px);
}

.movie-note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.movie-note-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.movie-note-title i {
  color: var(--accent-color);
  font-size: 1.5em;
}

.movie-note-title h3 {
  margin: 0;
  color: #fff;
  font-size: 1.3em;
}

.movie-note-actions {
  display: flex;
  gap: 8px;
}

.note-edit-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 8px 12px;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.note-edit-btn:hover {
  background: var(--accent-color);
  border-color: var(--accent-color);
  transform: scale(1.05);
}

.movie-note-content {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.05em;
  line-height: 1.7;
  white-space: pre-wrap;
  word-wrap: break-word;
  padding: 15px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  margin-bottom: 10px;
}

.movie-note-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.note-date {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9em;
  display: flex;
  align-items: center;
  gap: 6px;
}

.note-modal .note-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: rgba(33, 150, 243, 0.1);
  border: 1px solid rgba(33, 150, 243, 0.3);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 15px;
  font-size: 0.95em;
}

.note-info i {
  color: #2196f3;
  font-size: 1.2em;
}

.note-textarea {
  min-height: 200px;
  font-family: inherit;
  line-height: 1.6;
}

.char-counter {
  text-align: right;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.85em;
  margin-top: -10px;
  margin-bottom: 10px;
}

.note-form-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.note-form-actions button {
  flex: 1;
  min-width: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.delete-note-btn {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1em;
  font-weight: 600;
}

.delete-note-btn:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.3);
  border-color: rgba(239, 68, 68, 0.5);
  transform: scale(1.02);
}

.delete-note-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cancel-note-btn {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1em;
}

.cancel-note-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

@media (max-width: 600px) {
  .movie-note-display {
    margin: 20px -10px;
    padding: 15px;
  }

  .movie-note-title h3 {
    font-size: 1.1em;
  }

  .movie-note-content {
    font-size: 1em;
    padding: 12px;
  }

  .note-form-actions {
    flex-direction: column;
  }

  .note-form-actions button {
    width: 100%;
    min-width: unset;
  }
}
</style>
