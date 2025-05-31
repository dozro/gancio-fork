// composables/useCounter.ts
export const useCounter = () => {
  const count = useState('counter', () => 0)

  const isEven = computed(() => count.value % 2 === 0)

  const increment = () => count.value++
  const reset = () => (count.value = 0)

  return {
    count,
    isEven,
    increment,
    reset,
  }
}
