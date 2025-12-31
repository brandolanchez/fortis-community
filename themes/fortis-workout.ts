import { extendTheme } from '@chakra-ui/react';

export const fortisWorkoutTheme = extendTheme({
    initialColorMode: 'dark', // Using dark mode to better suit the black background
    useSystemColorMode: false,
    colors: {
        background: '#000000', // black
        text: '#FFFFFF', // white
        primary: '#D99414', // fortis-gold
        secondary: '#374151', // Dark Gray (gray-700) for elements needing contrast
        accent: '#D99414', // fortis-gold
        muted: '#1f2937', // Darker Gray (gray-800) for backgrounds/cards
        border: '#D99414', // fortis-gold for borders
        error: '#EF4444', // red-500
        success: '#22C55E', // green-500
        warning: '#F59E0B', // amber-500
    },
    fonts: {
        heading: '"Oswald", sans-serif',
        body: '"Lato", sans-serif',
        mono: 'monospace',
    },
    styles: {
        global: (props: { colorMode: string; }) => ({
            body: {
                bg: '#000000',
                color: '#FFFFFF',
            },
        }),
    },
    components: {
        Button: {
            baseStyle: {
                fontWeight: 'bold',
                textTransform: 'uppercase',
                borderRadius: 'sm', // More squared look
                fontFamily: 'heading',
            },
            variants: {
                solid: {
                    bg: 'primary',
                    color: '#000000',
                    _hover: {
                        bg: '#b57b10', // darker gold
                        color: 'black'
                    },
                },
                outline: {
                    borderColor: 'primary',
                    color: 'primary',
                    _hover: {
                        bg: 'rgba(217, 148, 20, 0.1)',
                    },
                },
                ghost: {
                    color: 'text',
                    _hover: {
                        color: 'primary',
                        bg: 'transparent'
                    }
                }
            },
        },
        Text: {
            baseStyle: {
                color: 'text',
            },
        },
        Heading: {
            baseStyle: {
                color: 'text',
                fontFamily: 'heading',
                fontWeight: 'bold',
                textTransform: 'uppercase',
            },
        },
        Card: {
            baseStyle: {
                container: {
                    bg: 'muted',
                    borderColor: 'gray.800',
                }
            }
        },
        Input: {
            baseStyle: {
                field: {
                    color: 'black',
                    _placeholder: {
                        color: 'gray.500',
                    },
                    bg: 'white',
                    borderColor: 'gray.600',
                },
            },
            defaultProps: {
                variant: 'filled',
            },
        },
        Textarea: {
            baseStyle: {
                color: 'black',
                _placeholder: {
                    color: 'gray.500',
                },
                bg: 'white',
                borderColor: 'gray.600',
            },
            defaultProps: {
                variant: 'filled',
            },
        },
        Modal: {
            baseStyle: {
                dialog: {
                    bg: 'muted',
                    color: 'text',
                },
                header: {
                    color: 'primary',
                },
            },
        },
    },
});
