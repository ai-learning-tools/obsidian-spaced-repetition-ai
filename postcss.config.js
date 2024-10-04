module.exports = {
    plugins: {
        tailwindcss: {},
        autoprefixer: {},
        'postcss-prefix-selector': {
            prefix: '.learn-plugin', // Use your unique class or ID here
            transform: (prefix, selector, prefixedSelector) => {
                // Optionally customize how selectors are prefixed
                return prefixedSelector;
            },
        },
    },
    to: './styles.css'
};