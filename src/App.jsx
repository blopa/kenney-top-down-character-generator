import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
    Container,
    FormControl,
    TextField,
    Divider,
    Button,
    InputLabel,
    Select, MenuItem,
} from '@mui/material';

// Styles
import styles from './App.module.css';

const contextResolver = require.context('./sprites/', true, /\.png$/);
const modulePaths = contextResolver.keys();
const directories = [...new Set(modulePaths.map((file) => file.split('/')[1]))];
const categoryOrder = {
    skin: 1,
    eyes: 2,
    torso: 3,
    'facial-hairs': 4,
    feet: 5,
    legs: 6,
    'hand-gear': 7,
    hairs: 8,
    'head-gear': 9,
};

const spritesCategories = directories.map((name) => ({
    name,
    canDisable: name !== 'skin',
    // randomizerNullable: false,
    randomizerNullable: ['hairs', 'facial-hairs', 'hand-gear', 'head-gear'].includes(name),
}));

const spritesObjects = modulePaths.map((modulePath) => {
    const base64Image = contextResolver(modulePath);
    const category = modulePath.split('/')[1];

    return {
        name: modulePath,
        image: base64Image,
        show: modulePath.includes('base-0'),
        category,
        order: categoryOrder[category] || Number.MAX_SAFE_INTEGER,
    };
}).sort((a, b) => a.order - b.order);

function App() {
    const [currFrame, setCurrFrame] = useState(0);
    const [fps, setFps] = useState(4);
    const [scale, setScale] = useState(6);
    const spriteWidth = 16;
    const spriteHeight = 16;
    const [spriteName, setSpriteName] = useState('sample');
    const [spriteFiles, setSpriteFiles] = useState(spritesObjects);
    const [canvasSize, setCanvasSize] = useState([null, null]);
    const [gridSize, setGridSize] = useState([null, null]);
    const [imageSize, setImageSize] = useState([null, null]);
    const canvas = useRef(null);
    const [columns, rows] = gridSize;

    const spritesOrder = useMemo(() => {
        const result = [];
        (new Array(columns)).fill(null).forEach((v1, rc) => {
            const cols = [];
            (new Array(rows)).fill(null).forEach((v2, cr) => {
                cols.push([-rc, -cr]);
            });

            result.push(...cols);
            // TODO redo this spritesOrder logic
            // add checkbox to make it reverse or not
            // cols.pop();
            // result.push(...cols.reverse());
        });

        return result;
    }, [columns, rows]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (currFrame >= spritesOrder.length - 1) {
                setCurrFrame(0);
            } else {
                setCurrFrame(currFrame + 1);
            }
        }, 1000 / fps);

        return () => clearInterval(interval);
    }, [currFrame, fps, spritesOrder.length]);

    const randomize = useCallback(() => {
        const newSprites = [...spriteFiles];
        spritesCategories.forEach(({ name: cat, randomizerNullable }) => {
            const categorySprites = newSprites.filter((sprite) => sprite.category === cat);
            const random =
                Math.floor(Math.random() * categorySprites.length)
                - (randomizerNullable ? Math.round(Math.random()) : 0);

            categorySprites.forEach((sprite, index) => {
                // eslint-disable-next-line no-param-reassign
                sprite.show = index === random;
            });
        });

        setSpriteFiles([...newSprites]);
    }, [spriteFiles]);

    const mergeImages = useCallback(() => {
        const ctx = canvas.current.getContext('2d');
        ctx.clearRect(0, 0, canvas.current.width, canvas.current.height);

        const filteredSprites = spriteFiles.filter(({ show }) => show);
        filteredSprites.forEach(({ image }, index) => {
            const htmlImage = new Image();
            htmlImage.addEventListener('load', () => {
                ctx.drawImage(htmlImage, 0, 0);
                if (index + 1 >= filteredSprites.length) {
                    const aDownloadLink = document.createElement('a');
                    aDownloadLink.download = `${spriteName || 'sample'}.png`;
                    aDownloadLink.href = canvas.current.toDataURL('image/png');
                    aDownloadLink.click();
                }
            });
            htmlImage.src = image;
        });
    }, [spriteFiles, spriteName]);

    const [width, height] = canvasSize;
    useEffect(() => {
        if (canvas.current) {
            const ctx = canvas.current.getContext('2d');
            ctx.clearRect(0, 0, canvas.current.width, canvas.current.height);

            const filteredSprites = spriteFiles.filter(({ show }) => show);
            filteredSprites.forEach(({ image }) => {
                const htmlImage = new Image();
                htmlImage.addEventListener('load', () => {
                    ctx.drawImage(htmlImage, 0, 0);
                    if (canvas.current && !width && !height) {
                        setCanvasSize([
                            htmlImage.width,
                            htmlImage.height,
                        ]);

                        setGridSize([
                            // row
                            htmlImage.width,
                            // column
                            htmlImage.height,
                        ]);

                        setImageSize([
                            // row
                            htmlImage.width,
                            // column
                            htmlImage.height,
                        ]);
                    }
                });
                htmlImage.src = image;
            });
        }
    }, [canvasSize, height, spriteFiles, width, spriteWidth, spriteHeight]);

    const handleSelectSprite = useCallback((category) => (e) => {
        const newSprites = spriteFiles.map((sprite) => {
            if (sprite.name === e.target.value) {
                return {
                    ...sprite,
                    show: true,
                };
            }

            if (sprite.category === category) {
                return {
                    ...sprite,
                    show: false,
                };
            }

            return sprite;
        });

        setSpriteFiles(newSprites);
    }, [spriteFiles, setSpriteFiles]);

    useEffect(() => {
        const [width, height] = imageSize;

        if (width && height) {
            setGridSize([
                // row
                Math.ceil(width / spriteWidth),
                // column
                Math.ceil(height / spriteHeight),
            ]);
        }
    }, [setGridSize, spriteWidth, spriteHeight, imageSize]);

    const [x, y] = spritesOrder?.[currFrame] || [];

    return (
        <Container className={styles.container} maxWidth="lg">
            <div>
                {spritesCategories.map((category) => {
                    const sprites = spriteFiles.filter((sprite) => sprite.category === category.name);
                    return (
                        <FormControl
                            variant="outlined"
                            sx={{ m: 1, minWidth: 120 }}
                            size="small"
                            key={category.name}
                        >
                            <InputLabel htmlFor="sprite-type-select">{category.name}</InputLabel>
                            <Select
                                labelId="sprite-type-label"
                                id="sprite-type-select"
                                value={sprites.find(({ show }) => show)?.name || ''}
                                onChange={handleSelectSprite(category.name)}
                                label={category.name}
                            >
                                <MenuItem value="">
                                    none
                                </MenuItem>
                                {sprites.map(({ name }) => (
                                    <MenuItem key={name} value={name}>
                                        {name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    );
                })}
                <Divider sx={{ marginTop: '10px', marginBottom: '10px' }} />
                <FormControl variant="outlined" sx={{ m: 1, minWidth: 120 }}>
                    <div style={{ display: 'inline-flex' }}>
                        <TextField
                            id="fps"
                            label="FPS"
                            type="number"
                            inputProps={{ min: 1 }}
                            sx={{ marginRight: '5px' }}
                            value={fps}
                            size="small"
                            onChange={(e) => setFps(Number.parseInt(e.target.value, 10))}
                        />
                        <TextField
                            id="scale"
                            label="Scale"
                            type="number"
                            inputProps={{ min: 1 }}
                            value={scale}
                            size="small"
                            onChange={(e) => setScale(Number.parseInt(e.target.value, 10))}
                        />
                    </div>
                </FormControl>
            </div>
            <Divider sx={{ marginTop: '10px', marginBottom: '10px' }} />
            <FormControl variant="outlined" sx={{ m: 1, minWidth: 120 }}>
                <div style={{ display: 'inline-flex' }}>
                    <TextField
                        id="spriteName"
                        label="Sprite Name"
                        variant="outlined"
                        value={spriteName}
                        size="small"
                        sx={{ marginRight: '5px' }}
                        onChange={(e) => setSpriteName(e.target.value)}
                    />
                    <Button
                        onClick={mergeImages}
                        variant="contained"
                        color="primary"
                        sx={{ marginRight: '5px' }}
                    >
                        Save
                    </Button>
                    <Button
                        onClick={randomize}
                        variant="contained"
                        color="secondary"
                    >
                        Randomize
                    </Button>
                </div>
            </FormControl>
            <Divider sx={{ marginTop: '10px', marginBottom: '10px' }} />
            <div>
                {(new Array(columns)).fill(null).map((v, rc) => (
                    <div style={{ marginLeft: `${spriteWidth * rc * scale}px` }}>
                        {spriteFiles.map(({ image, name, show }) => {
                            if (!show) {
                                return null;
                            }

                            return (
                                <div
                                    // eslint-disable-next-line react/no-array-index-key
                                    key={`${name}-${rc}`}
                                    style={{
                                        imageRendering: 'pixelated',
                                        overflow: 'hidden',
                                        backgroundRepeat: 'no-repeat',
                                        display: 'table-cell',
                                        backgroundImage: `url(${image})`,
                                        width: `${spriteWidth}px`,
                                        height: `${spriteHeight}px`,
                                        transformOrigin: '0px 50%',
                                        backgroundPosition: `${-rc * spriteWidth}px ${y * spriteHeight}px`,
                                        zoom: scale,
                                        position: 'absolute',
                                    }}
                                />
                            );
                        })}
                    </div>
                ))}
            </div>
            <canvas
                ref={canvas}
                width={width}
                height={height}
                style={{
                    zoom: scale,
                    float: 'right',
                    marginRight: '20px',
                    imageRendering: 'pixelated',
                    display: 'none',
                }}
            />
        </Container>
    );
}

export default App;
