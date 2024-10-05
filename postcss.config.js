module.exports = {
    plugins: {
        tailwindcss: {},
        autoprefixer: {},
        'postcss-prefix-selector': {
            prefix: '.learn-plugin', // our unique id
            transform: (prefix, selector, prefixedSelector) => {
                return prefixedSelector;
            },
        },
    },
    to: './styles.css'
};