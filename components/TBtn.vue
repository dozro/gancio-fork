<template>
    <v-tooltip top>
        <template #activator="{ on, attrs}">
            <v-btn v-bind="attrs" :icon='icon' :to='to' :large="large" :small="small" text :color='color' v-on="on" @click='$emit("click")'>
                <slot />
            </v-btn>
        </template>
        <span>{{ $t(tooltip) }}</span>
    </v-tooltip>
</template>
<script>
export default {
    name: 'TBtn',
    props: {
        tooltip: String,
        color: String,
        to: String,
        icon: String,
        large: { type: Boolean, default: false },
        small: { type: Boolean, default: false }
    }
}
</script>