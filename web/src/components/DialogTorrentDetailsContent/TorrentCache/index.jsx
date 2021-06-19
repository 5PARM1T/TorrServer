import Measure from 'react-measure'
import { useState, memo, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import isEqual from 'lodash/isEqual'

import { useCreateCacheMap } from '../customHooks'
import getShortCacheMap from './getShortCacheMap'
import { SnakeWrapper, ScrollNotification } from './style'
import { readerColor, rangeColor, createGradient, snakeSettings } from './snakeSettings'

const TorrentCache = ({ cache, isMini }) => {
  const { t } = useTranslation()
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const { width } = dimensions
  const canvasRef = useRef(null)
  const ctxRef = useRef(null)
  const cacheMap = useCreateCacheMap(cache)
  const settingsTarget = isMini ? 'mini' : 'default'
  const { borderWidth, pieceSize, gapBetweenPieces, backgroundColor, borderColor, cacheMaxHeight, completeColor } =
    snakeSettings[settingsTarget]

  const canvasWidth = isMini ? width * 0.93 : width

  const pieceSizeWithGap = pieceSize + gapBetweenPieces
  const piecesInOneRow = Math.floor(canvasWidth / pieceSizeWithGap)

  let shotCacheMap
  if (isMini) {
    const preloadPiecesAmount = Math.round(cache.Capacity / cache.PiecesLength - 1)
    shotCacheMap = getShortCacheMap({ cacheMap, preloadPiecesAmount, piecesInOneRow })
  }
  const source = isMini ? shotCacheMap : cacheMap
  const startingXPoint = Math.ceil((canvasWidth - pieceSizeWithGap * piecesInOneRow) / 2) // needed to center grid
  const height = Math.ceil(source.length / piecesInOneRow) * pieceSizeWithGap

  useEffect(() => {
    if (!canvasWidth || !height) return

    const canvas = canvasRef.current
    canvas.width = canvasWidth
    canvas.height = height
    ctxRef.current = canvas.getContext('2d')
  }, [canvasRef, height, canvasWidth])

  useEffect(() => {
    const ctx = ctxRef.current
    if (!ctx) return

    ctx.clearRect(0, 0, canvasWidth, height)

    source.forEach(({ percentage, isReader, isReaderRange }, i) => {
      const inProgress = percentage > 0 && percentage < 100
      const isCompleted = percentage === 100
      const currentRow = i % piecesInOneRow
      const currentColumn = Math.floor(i / piecesInOneRow)
      const fixBlurStroke = borderWidth % 2 === 0 ? 0 : 0.5
      const requiredFix = Math.ceil(borderWidth / 2) + 1 + fixBlurStroke
      const x = currentRow * pieceSize + currentRow * gapBetweenPieces + startingXPoint + requiredFix
      const y = currentColumn * pieceSize + currentColumn * gapBetweenPieces + requiredFix

      ctx.lineWidth = borderWidth
      ctx.fillStyle = inProgress
        ? createGradient(ctx, percentage, settingsTarget)
        : isCompleted
        ? completeColor
        : backgroundColor
      ctx.strokeStyle = isReader
        ? readerColor
        : inProgress || isCompleted
        ? completeColor
        : isReaderRange
        ? rangeColor
        : borderColor

      ctx.translate(x, y)
      ctx.fillRect(0, 0, pieceSize, pieceSize)
      ctx.strokeRect(0, 0, pieceSize, pieceSize)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
    })
  }, [
    cacheMap,
    height,
    canvasWidth,
    piecesInOneRow,
    startingXPoint,
    pieceSize,
    gapBetweenPieces,
    source,
    backgroundColor,
    borderColor,
    borderWidth,
    settingsTarget,
    completeColor,
  ])

  return (
    <Measure bounds onResize={({ bounds }) => setDimensions(bounds)}>
      {({ measureRef }) => (
        <div style={{ display: 'flex', flexDirection: 'column' }} ref={measureRef}>
          <SnakeWrapper isMini={isMini}>
            <canvas ref={canvasRef} />
          </SnakeWrapper>

          {isMini && height >= cacheMaxHeight && <ScrollNotification>{t('ScrollDown')}</ScrollNotification>}
        </div>
      )}
    </Measure>
  )
}

export default memo(
  TorrentCache,
  (prev, next) => isEqual(prev.cache.Pieces, next.cache.Pieces) && isEqual(prev.cache.Readers, next.cache.Readers),
)
