import { useState, useMemo, useEffect, useRef, useCallback, Fragment } from 'react';
import {
    Container,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    TextField,
    Divider,
    Checkbox,
    Typography,
    IconButton,
    Box,
    Button,
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp, RemoveCircleOutlined } from '@mui/icons-material';
import Dropzone from './components/DropZone';

// Styles
import styles from './App.module.css';

// Utils
import { getBase64 } from './utils/utils';

// Constants
const MAX_NAME_SIZE = 20;

function App() {
    const [currFrame, setCurrFrame] = useState(0);
    const [fps, setFps] = useState(3);
    const [scale, setScale] = useState(3);
    const [spriteWidth, setSpriteWidth] = useState(20);
    const [spriteHeight, setSpriteHeight] = useState(20);
    const [spriteWidthQty, setSpriteWidthQty] = useState(1);
    const [spriteHeightQty, setSpriteHeightQty] = useState(1);
    const [spriteName, setSpriteName] = useState('sample');
    const [spriteFiles, setSpriteFiles] = useState([]);
    const [canvasSize, setCanvasSize] = useState([null, null]);
    const [gridSize, setGridSize] = useState([null, null]);
    const [imageSize, setImageSize] = useState([null, null]);
    const [order, setOrder] = useState('columns');
    const [spritesCategories, setSpritesCategories] = useState([
        { name: 'base', canDisable: false },
        { name: 'torsos' },
        { name: 'feet' },
        { name: 'hands' },
        { name: 'heads' },
        { name: 'eyes' },
        { name: 'tools' },
        { name: 'hairs', randomizerNullable: true },
        { name: 'hats', randomizerNullable: true },
    ]);
    const [category, setCategory] = useState(spritesCategories[0]);
    const canvas = useRef(null);
    const [columns, rows] = gridSize;
    const isColumns = order === 'columns';

    const spritesOrder = useMemo(() => {
        const result = [];
        (new Array(isColumns ? columns : rows)).fill(null).forEach((v1, rc) => {
            const cols = [];
            (new Array(isColumns ? rows : columns)).fill(null).forEach((v2, cr) => {
                cols.push(isColumns ? [-rc, -cr] : [-cr, -rc]);
            });

            result.push(...cols);
            // TODO redo this spritesOrder logic
            // add checkbox to make it reverse or not
            // cols.pop();
            // result.push(...cols.reverse());
        });

        return result;
    }, [columns, rows, order, isColumns]);

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

    const changeSpritePosition = useCallback((from, to) => {
        if (to > spriteFiles.length - 1 || to < 0) {
            return;
        }

        const newSpriteFiles = [...spriteFiles];
        const f = newSpriteFiles.splice(from, 1)[0];
        newSpriteFiles.splice(to, 0, f);
        setSpriteFiles(newSpriteFiles);
    }, [spriteFiles]);

    const removeSprite = useCallback((index) => {
        setSpriteFiles(spriteFiles.filter((val, idx) => idx !== index));
    }, [spriteFiles]);

    const handleOrderChange = useCallback((e) => {
        setOrder(e.target.value);
    }, [setOrder]);

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
    }, [spriteFiles, spritesCategories]);

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
                        setSpriteHeight(htmlImage.height);
                        setSpriteWidth(htmlImage.width);
                    }
                });
                htmlImage.src = image;
            });
        }
    }, [canvasSize, height, spriteFiles, width, spriteWidth, spriteHeight]);

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
    const containsSprites = spriteFiles.length > 0;

    const handleOnDrop = useCallback(async (acceptedFiles) => {
        const newSprites = [...spriteFiles];
        // eslint-disable-next-line no-restricted-syntax
        for (const acceptedFile of acceptedFiles) {
            newSprites.push({
                name: acceptedFile.name,
                // eslint-disable-next-line no-await-in-loop
                image: await getBase64(acceptedFile),
                show: true,
                category: category.name,
            });
        }

        setSpriteFiles(newSprites);
    }, [spriteFiles, category.name]);

    return (
        <Container className={styles.container} maxWidth="lg">
            <FormControl variant="outlined" sx={{ m: 1, minWidth: 120 }} size="small">
                <InputLabel htmlFor="sprite-type-select">Sprite Type</InputLabel>
                <Select
                    labelId="sprite-type-label"
                    id="sprite-type-select"
                    value={category.name}
                    onChange={(e) => {
                        const cat = spritesCategories.find(({ name }) => name === e.target.value);
                        setCategory(cat);
                    }}
                    label="Sprite Type"
                >
                    {spritesCategories.map(({ name: cat }) => (
                        <MenuItem key={cat} value={cat}>
                            {cat}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            <Dropzone onDrop={handleOnDrop} />
            {containsSprites && (
                <Fragment>
                    <Divider sx={{ marginTop: '10px', marginBottom: '10px' }} />
                    <div>
                        <div>
                            <FormControl variant="outlined" sx={{ m: 1, minWidth: 120 }} size="small">
                                <InputLabel htmlFor="sprite-order">Order</InputLabel>
                                <Select
                                    labelId="sprite-order"
                                    id="sprite-order"
                                    value={order}
                                    onChange={handleOrderChange}
                                    label="Order"
                                >
                                    <MenuItem value="columns">
                                        Columns - Rows
                                    </MenuItem>
                                    <MenuItem value="rows">
                                        Rows - Columns
                                    </MenuItem>
                                </Select>
                            </FormControl>
                        </div>
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
                        <FormControl variant="outlined" sx={{ m: 1, minWidth: 120 }} size="small">
                            <div style={{ display: 'inline-flex' }}>
                                <TextField
                                    id="spriteWidth"
                                    label="Sprite Width"
                                    type="number"
                                    inputProps={{ min: 1 }}
                                    sx={{ marginRight: '5px' }}
                                    value={spriteWidth}
                                    onChange={(e) => {
                                        const [width, height] = imageSize;
                                        const val = Number.parseInt(e.target.value, 10);
                                        setSpriteWidthQty(width / val);
                                        setSpriteWidth(val);
                                    }}
                                    size="small"
                                />
                                <TextField
                                    id="spriteHeight"
                                    label="Sprite Height"
                                    type="number"
                                    inputProps={{ min: 1 }}
                                    value={spriteHeight}
                                    onChange={(e) => {
                                        const [width, height] = imageSize;
                                        const val = Number.parseInt(e.target.value, 10);
                                        setSpriteHeightQty(height / val);
                                        setSpriteHeight(val);
                                    }}
                                    size="small"
                                />
                            </div>
                        </FormControl>
                        <FormControl variant="outlined" sx={{ m: 1, minWidth: 120 }} size="small">
                            <div style={{ display: 'inline-flex' }}>
                                <TextField
                                    id="spriteWidthQty"
                                    label="Sprite Width Qty"
                                    type="number"
                                    sx={{ marginRight: '5px' }}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                    variant="outlined"
                                    size="small"
                                    value={spriteWidthQty}
                                    onChange={(e) => {
                                        const [width, height] = imageSize;
                                        const val = Number.parseInt(e.target.value, 10);
                                        setSpriteWidth(width / val);
                                        setSpriteWidthQty(val);
                                    }}
                                />
                                <TextField
                                    id="spriteHeightQty"
                                    label="Sprite Height Qty"
                                    type="number"
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                    variant="outlined"
                                    size="small"
                                    value={spriteHeightQty}
                                    onChange={(e) => {
                                        const [width, height] = imageSize;
                                        const val = Number.parseInt(e.target.value, 10);
                                        setSpriteHeight(height / val);
                                        setSpriteHeightQty(val);
                                    }}
                                />
                            </div>
                        </FormControl>
                    </div>
                    <Divider sx={{ marginTop: '10px', marginBottom: '10px' }} />
                    {spriteFiles.map(({ image, name, show, category: cat }, index) => (
                        <Box key={name} display="flex" alignItems="center">
                            <Checkbox
                                id={`check-${name}`}
                                checked={show}
                                onChange={() => {
                                    const newSpriteFiles = [...spriteFiles];
                                    newSpriteFiles[index] = {
                                        ...newSpriteFiles[index],
                                        show: !show,
                                    };
                                    setSpriteFiles(newSpriteFiles);
                                }}
                            />
                            <Typography htmlFor={`check-${name}`} variant="body1">
                                {name.length > MAX_NAME_SIZE ? `${name.substring(0, MAX_NAME_SIZE)}...` : name} - {cat} {' '}
                            </Typography>
                            <IconButton onClick={() => changeSpritePosition(index, index - 1)} type="button">
                                <KeyboardArrowUp />
                            </IconButton>
                            <IconButton onClick={() => changeSpritePosition(index, index + 1)} type="button">
                                <KeyboardArrowDown />
                            </IconButton>
                            <IconButton onClick={() => removeSprite(index, name)} type="button">
                                <RemoveCircleOutlined />
                            </IconButton>
                        </Box>
                    ))}
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
                        {(new Array(isColumns ? columns : rows)).fill(null).map((v, rc) => (
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
                                                backgroundPosition:
                                                        `${(isColumns ? -rc : x) * spriteWidth}px ${(!isColumns ? -rc : y) * spriteHeight}px`,
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
                </Fragment>
            )}
        </Container>
    );
}

export default App;
