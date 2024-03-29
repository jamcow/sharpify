module.exports = {
    extends: ['wesbos'],
    rules: {
        'prettier/prettier': [
            'error',
            {
                trailingComma: 'es5',
                singleQuote: true,
                printWidth: 120,
                tabWidth: 4,
                endOfLine: 'auto',
            },
        ],
    },
};
