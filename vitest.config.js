import { defineConfig } from 'vitest/config'
import { BaseSequencer } from 'vitest/node'

class CustomSequencer extends BaseSequencer {
  sort(files) {
    return files.sort((a, b) => a < b)
  }
}

export default defineConfig({
  test: {
    fileParallelism: false,
    isolate: false,
    sequence: {
      sequencer: CustomSequencer
    }
  }
})
