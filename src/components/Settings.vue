<template>
  <div class="settings-page">
    <h1>Настройки</h1>
    <div class="settings-container">
      <div class="settings-group">
        <h2>Фон</h2>
        <div class="radio-group">
          <label class="radio">
            <input v-model="backgroundType" type="radio" value="default" />
            <span class="radio-label">По умолчанию</span>
          </label>
          <label class="radio">
            <input v-model="backgroundType" type="radio" value="stars" />
            <span class="radio-label">Звёзды</span>
          </label>
          <label class="radio">
            <input v-model="backgroundType" type="radio" value="disabled" />
            <span class="radio-label">Отключено</span>
          </label>
        </div>
        <button class="reset-button" @click="resetBackground">Сбросить фон</button>
      </div>

      <div class="settings-group">
        <h2>Тема</h2>
        <div class="theme-box">
          <div class="theme-header">
            <span class="theme-icon material-icons" aria-hidden="true">palette</span>
            <span class="api-subtitle">Цвет акцента:</span>
          </div>
          <div class="theme-inner">
            <div class="add-row">
              <button class="color-add" @click="$refs.colorInput.click()">+</button>
              <span class="add-label">Добавить цвет</span>
              <input ref="colorInput" type="color" style="display: none" @change="onAddColor" />
            </div>
            <div class="color-grid">
              <template v-for="color in themeStore.allColors" :key="color.value">
                <button
                  :class="['color-swatch', { active: themeStore.accentColor === color.value }]"
                  :style="{
                    backgroundColor: color.value,
                    borderColor: themeStore.accentColor === color.value ? 'white' : 'transparent'
                  }"
                  :title="color.name"
                  @click="themeStore.setAccentColor(color.value)"
                ></button>
              </template>
            </div>
          </div>
        </div>
      </div>

      <div class="settings-group">
        <h2>Карточки</h2>
        <p class="api-subtitle">Размер карточек:</p>
        <div class="radio-group">
          <label class="radio"
            ><input v-model="cardSize" type="radio" value="small" /> Маленький</label
          >
          <label class="radio"
            ><input v-model="cardSize" type="radio" value="medium" /> Средний</label
          >
          <label class="radio"
            ><input v-model="cardSize" type="radio" value="large" /> Большой</label
          >
        </div>
      </div>

      <div class="settings-group">
        <h2>Плеер</h2>
        <label class="setting-item">
          <SliderRound v-model="isCentered">Автоцентрирование плеера</SliderRound>
        </label>
        <label class="setting-item">
          <SliderRound v-model="isCardBorder">Окантовка вокруг карточек</SliderRound>
        </label>
        <label class="setting-item">
          <SliderRound v-model="isCardHoverDisabled"
            >Отключить подъём карточек при наведении</SliderRound
          >
        </label>
        <button class="reset-button" @click="resetKinoBdSources">Очистить источники kinobd</button>
      </div>

      <div class="settings-group">
        <h2>История и поиск</h2>
        <label class="setting-item">
          <SliderRound v-model="isHistoryAllowed">Сохранять историю просмотра</SliderRound>
        </label>
        <label class="setting-item">
          <SliderRound v-model="isCtrlFEnabled">Перехватывать Ctrl+F для поиска</SliderRound>
        </label>
        <label class="setting-item">
          <SliderRound v-model="rememberScrollPosition">Запоминать позицию скролла</SliderRound>
        </label>
        <button class="reset-button" @click="openClearHistory">Очистить историю просмотра</button>
      </div>

      <div class="settings-group">
        <h2>API</h2>
        <div class="radio-group">
          <p class="api-subtitle">API для данных / плеера</p>
          <label class="radio"
            ><input v-model="contentApiProvider" type="radio" value="kinobd" /> KinoBD
            (search/cards/players)</label
          >
          <label class="radio"
            ><input v-model="contentApiProvider" type="radio" value="kinobox" /> Kinobox
            (players)</label
          >
        </div>
        <p class="api-note">KinoBD: поиск, карточки и плееры. Kinobox: только плееры.</p>

        <div class="radio-group" style="margin-top: 12px">
          <p class="api-subtitle">API для поиска</p>
          <label class="radio"
            ><input v-model="searchApiProvider" type="radio" value="kinobd" /> KinoBD</label
          >
        </div>

        <p class="api-note">Этот параметр влияет только на поиск по названию.</p>
      </div>

      <div class="settings-group">
        <h2>Версия сайта</h2>
        {{ appVersion }}
      </div>
    </div>

    <BaseModal
      :is-open="showModal"
      message="Вы уверены, что хотите очистить историю?"
      @confirm="confirmClearHistory"
      @close="closeModal"
    />
  </div>
</template>

<script setup>
import SliderRound from '@/components/slider/SliderRound.vue'
import BaseModal from './BaseModal.vue'
import { useBackgroundStore } from '@/store/background'
import { useMainStore } from '@/store/main'
import { usePlayerStore } from '@/store/player'
import { useThemeStore } from '@/store/theme'
import { computed, ref, watch } from 'vue'

const backgroundStore = useBackgroundStore()
const mainStore = useMainStore()
const playerStore = usePlayerStore()

const showModal = ref(false)
const appVersion = ref(import.meta.env.VITE_APP_VERSION_FULL_VERSION)

const themeStore = useThemeStore()
themeStore.initTheme()

const clearAllHistory = () => {
  mainStore.clearAllHistory()
}

const openClearHistory = () => {
  showModal.value = true
}

const confirmClearHistory = () => {
  clearAllHistory()
  showModal.value = false
}

const closeModal = () => {
  showModal.value = false
}

const backgroundType = computed({
  get: () => backgroundStore.backgroundType,
  set: (value) => backgroundStore.updateBackgroundType(value)
})

const isBlurDisabled = computed(
  () => backgroundType.value === 'stars' || backgroundType.value === 'disable'
)
watch(isBlurDisabled, (newValue) => {
  if (newValue) {
    backgroundStore.toggleBlur(false)
  }
})

const isCentered = computed({
  get: () => playerStore.isCentered,
  set: (value) => playerStore.updateCentering(value)
})

const isCardBorder = computed({
  get: () => backgroundStore.isCardBorder,
  set: (value) => backgroundStore.toggleCardBorder(value)
})

const isCardHoverDisabled = computed({
  get: () => backgroundStore.isCardHoverDisabled,
  set: (value) => backgroundStore.toggleCardHover(value)
})

const isHistoryAllowed = computed({
  get: () => mainStore.isHistoryAllowed,
  set: (value) => mainStore.setHistoryAllowed(value)
})

const contentApiProvider = computed({
  get: () => mainStore.contentApiProvider,
  set: (value) => mainStore.setContentApiProvider(value)
})

const searchApiProvider = computed({
  get: () => mainStore.searchApiProvider,
  set: (value) => mainStore.setSearchApiProvider(value)
})

const isCtrlFEnabled = computed({
  get: () => mainStore.isCtrlFEnabled,
  set: () => mainStore.toggleCtrlF()
})

const cardSize = computed({
  get: () => mainStore.cardSize,
  set: (value) => mainStore.updateCardSize(value)
})

const rememberScrollPosition = computed({
  get: () => mainStore.rememberScrollPosition,
  set: (value) => mainStore.setRememberScrollPosition(value)
})

const resetBackground = () => {
  backgroundStore.resetBackground()
}

const resetKinoBdSources = () => {
  playerStore.clearKinoBdSources()
}

function onAddColor(event) {
  const value = event.target.value
  if (value) {
    themeStore.addCustomColor(value)
    themeStore.setAccentColor(value)
    // reset input to allow re-choosing same color later
    event.target.value = ''
  }
}
</script>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  color: #fff;
  min-height: 100vh;
}

h1 {
  text-align: center;
  margin-bottom: 2.5rem;
  color: #ffffff;
  font-size: 2rem;
  font-weight: 500;
}

.settings-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--accent-transparent);
  background: rgba(255, 255, 255, 0.02);
}

.back-button {
  background: none;
  border: none;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
}

.settings-container {
  background: #2a2a2a;
  padding: 20px;
  border-radius: 10px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  border: 1px solid var(--accent-transparent);
  display: flex;
  flex-direction: column;
  gap: 35px;
  margin-bottom: 40px;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

h2 {
  font-size: 16px;
  margin-bottom: 10px;
  margin: 0;
}

.radio {
  display: flex;
  align-items: center;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.radio input {
  margin-right: 10px;
}

.radio-label {
  cursor: pointer;
}

.reset-button {
  padding: 10px 16px;
  border-radius: 6px;
  border: none;
  background-color: var(--accent-color);
  color: white;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 6px;
}

.reset-button:hover {
  background-color: var(--accent-hover-color, var(--accent-hover));
}

.radio input:checked {
  accent-color: var(--accent-color);
}

.card-size-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card-size-group label:first-child {
  font-weight: 500;
  margin-bottom: 5px;
}

.api-note {
  margin: 0;
  opacity: 0.85;
  font-size: 13px;
  line-height: 1.35;
}

.api-subtitle {
  margin: 6px 0 0;
  font-size: 14px;
  font-weight: 600;
}

.theme-box {
  background: rgba(0, 0, 0, 0.25);
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--accent-transparent);
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(6, 36px);
  gap: 10px;
  margin-top: 10px;
  align-items: center;
}

.theme-header {
  display: flex;
  gap: 8px;
  align-items: center;
}

.theme-icon {
  display: inline-flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  color: var(--accent-color);
  border-radius: 6px;
  font-size: 20px;
  line-height: 1;
}

.theme-inner {
  margin-top: 12px;
}

.add-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.add-label {
  color: #fff;
  font-size: 13px;
}

.color-swatch {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  border: 2px solid transparent;
  cursor: pointer;
  position: relative;
}

.color-swatch.active::after {
  content: '✔';
  position: absolute;
  left: 6px;
  top: 4px;
  color: white;
  font-size: 16px;
}

.color-swatch {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  border: 2px solid transparent;
  cursor: pointer;
}

.color-swatch.active {
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.08) inset;
  transform: translateY(-2px);
}

.color-add {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  background: white;
  color: #222;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: none;
}
</style>
