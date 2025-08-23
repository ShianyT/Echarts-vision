import { defineStore } from 'pinia'
import { ref } from 'vue'


// 使用pinia进行存储共享数据theme
export const useThemeStore = defineStore('theme', () => {
  const storedTheme = localStorage.getItem('theme') || 'chalk';
  const theme = ref(storedTheme);

  function changeTheme() {
    if (theme.value === 'chalk') theme.value = 'vintage';
    else theme.value = 'chalk';
    localStorage.setItem('theme', theme.value);
  }

  return { theme, changeTheme };
});
