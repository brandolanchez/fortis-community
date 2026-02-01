import React from 'react';
import { Box } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';

const rotate = keyframes`
  0% { transform: rotateX(-30deg) rotateY(0deg); }
  100% { transform: rotateX(-30deg) rotateY(360deg); }
`;

const shine = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

interface MagnesiumCubeProps {
    size?: number | string;
    isConsuming?: boolean;
    color?: string;
}

const MagnesiumCube: React.FC<MagnesiumCubeProps> = ({
    size = "100px",
    isConsuming = false,
    color = "#ffffff"
}) => {
    const isGold = color.toLowerCase() === '#ffd700';
    const baseSize = typeof size === 'number' ? size : parseInt(size);

    // Real block proportions: Square front (W=base, H=base), half depth (D=base/2)
    const W = baseSize;
    const H = baseSize;
    const D = baseSize / 2;

    const faceStyle: any = {
        position: 'absolute',
        border: isGold ? '1px solid rgba(255, 215, 0, 0.5)' : '1px solid rgba(0, 0, 0, 0.15)',
        backfaceVisibility: 'visible',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.5s ease',
    };

    // Helper to darken colors for sides
    const adjustColor = (hex: string, percent: number) => {
        const cleanedHex = hex.replace("#", "");
        const num = parseInt(cleanedHex, 16),
            amt = Math.round(2.55 * percent),
            R = (num >> 16) + amt,
            G = (num >> 8 & 0x00FF) + amt,
            B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 0 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 0 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 0 ? 0 : B : 255)).toString(16).slice(1);
    };

    const sideColor = adjustColor(color, -15);
    const topColor = color;
    const bottomColor = adjustColor(color, -25);

    const goldGradient = isGold
        ? `linear-gradient(135deg, ${topColor} 0%, #FFFACD 50%, ${topColor} 100%)`
        : undefined;

    const goldAnimation = isGold ? `${shine} 3s linear infinite` : undefined;

    return (
        <Box
            width={`${W}px`}
            height={`${H}px`}
            display="flex"
            alignItems="center"
            justifyContent="center"
            m="auto"
            style={{ perspective: '800px' }}
        >
            <Box
                position="relative"
                width={`${W}px`}
                height={`${H}px`}
                sx={{
                    transformStyle: 'preserve-3d',
                }}
                animation={isConsuming ? 'none' : `${rotate} 8s linear infinite`}
                transform={isConsuming ? 'scale(0) rotateX(45deg) rotateY(45deg)' : 'rotateX(-30deg) rotateY(45deg)'}
                transition="transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
            >
                {/* Front */}
                <Box
                    {...faceStyle}
                    width={`${W}px`}
                    height={`${H}px`}
                    top="0"
                    left="0"
                    style={{ transform: `rotateY(0deg) translateZ(${D / 2}px)` }}
                    background={goldGradient || topColor}
                    backgroundSize={isGold ? "200% 100%" : undefined}
                    animation={goldAnimation}
                    boxShadow={isGold ? "0 0 15px rgba(255, 215, 0, 0.3)" : "inset 0 0 30px rgba(0,0,0,0.03)"}
                />
                {/* Back */}
                <Box
                    {...faceStyle}
                    width={`${W}px`}
                    height={`${H}px`}
                    top="0"
                    left="0"
                    style={{ transform: `rotateY(180deg) translateZ(${D / 2}px)` }}
                    background={sideColor}
                />
                {/* Right */}
                <Box
                    {...faceStyle}
                    width={`${D}px`}
                    height={`${H}px`}
                    top="0"
                    left={`${(W - D) / 2}px`}
                    style={{ transform: `rotateY(90deg) translateZ(${W / 2}px)` }}
                    background={sideColor}
                    boxShadow={isGold ? "inset 0 0 20px rgba(0,0,0,0.2)" : "inset 0 0 40px rgba(0,0,0,0.08)"}
                />
                {/* Left */}
                <Box
                    {...faceStyle}
                    width={`${D}px`}
                    height={`${H}px`}
                    top="0"
                    left={`${(W - D) / 2}px`}
                    style={{ transform: `rotateY(-90deg) translateZ(${W / 2}px)` }}
                    background={sideColor}
                />
                {/* Top */}
                <Box
                    {...faceStyle}
                    width={`${W}px`}
                    height={`${D}px`}
                    top={`${(H - D) / 2}px`}
                    left="0"
                    style={{ transform: `rotateX(90deg) translateZ(${H / 2}px)` }}
                    background={goldGradient || topColor}
                    backgroundSize={isGold ? "200% 100%" : undefined}
                    animation={goldAnimation}
                    boxShadow={isGold ? "0 0 20px rgba(255, 215, 0, 0.4)" : "inset 0 0 20px rgba(217, 148, 20, 0.12)"}
                />
                {/* Bottom */}
                <Box
                    {...faceStyle}
                    width={`${W}px`}
                    height={`${D}px`}
                    top={`${(H - D) / 2}px`}
                    left="0"
                    style={{ transform: `rotateX(-90deg) translateZ(${H / 2}px)` }}
                    background={bottomColor}
                    boxShadow={isGold ? "0 0 40px rgba(255, 215, 0, 0.2)" : "0 0 40px rgba(0,0,0,0.15)"}
                />
            </Box>
        </Box>
    );
};

export default MagnesiumCube;
