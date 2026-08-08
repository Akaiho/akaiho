<template>
  <div class="nav-component">
    <!-- Мобильное меню -->
    <MobileMenu v-if="isMobile" :links="navLinks" />

    <!-- Десктопная боковая панель -->
    <DesktopMenu v-else :links="navLinks" />

    <!-- Модальное окно поиска -->
    <transition name="fade">
      <ModalSearch v-if="navbarStore.isModalSearchVisible" />
    </transition>
  </div>
</template>

<script setup>
import { useMainStore } from '@/store/main'
import { useNavbarStore } from '@/store/navbar'
import { computed, ref } from 'vue'
import DesktopMenu from './MenuNavigation/DesktopMenu.vue'
import MobileMenu from './MenuNavigation/MobileMenu.vue'
import ModalSearch from './ModalSearch.vue'

const store = useMainStore()
const navbarStore = useNavbarStore()
const isMobile = computed(() => store.isMobile)
const navLinks = ref([])

const initializeNavLinks = () => {
  navLinks.value = [
    { to: '/', exact: true, icon: 'fas fa-home', text: 'Главная' },
    { to: '/top', icon: 'fa-solid fa-trophy', text: 'Популярное' },
    { to: '/settings', icon: 'fa-solid fa-gear', text: 'Настройки' },
    { href: 'https://t.me/Akaihoho', icon: 'fab fa-telegram', text: 'Telegram' }
  ]
}

initializeNavLinks()
</script>

<style scoped>
.nav-component {
  font-family: 'Neucha', sans-serif;
  font-weight: 400;
  font-size: 20px;
}

/* Стили для анимации fade */
.fade-enter-active {
  transition: opacity 0.3s ease;
}

.fade-leave-active {
  transition: all 0s;
}

.fade-enter-from {
  opacity: 0;
}

.fade-enter-to {
  opacity: 1;
}
</style>
