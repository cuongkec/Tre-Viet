import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import getCroppedImg from '../lib/cropImage'

interface ImageCropDialogProps {
  imageSrc: string
  aspectRatio: number
  onCancel: () => void
  onComplete: (croppedFile: File) => void
}

export default function ImageCropDialog({
  imageSrc,
  aspectRatio,
  onCancel,
  onComplete,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleApply = async () => {
    if (!croppedAreaPixels) return
    setIsProcessing(true)
    try {
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels, 'cropped-image.jpg')
      onComplete(croppedFile)
    } catch (e) {
      console.error(e)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-3xl rounded-[2px] overflow-hidden flex flex-col h-[80vh]">
        <div className="p-6 border-b border-editorial-line/10 flex justify-between items-center">
          <h3 className="text-xl font-serif">Cắt Hình Ảnh</h3>
          <button onClick={onCancel} className="text-[#666] hover:text-black uppercase text-[10px] tracking-widest font-bold">
            Hủy
          </button>
        </div>
        
        <div className="relative flex-1 bg-editorial-bg">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>
        
        <div className="p-6 border-t border-editorial-line/10 flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="flex-1 w-full max-w-xs flex items-center gap-4">
            <span className="text-[10px] uppercase font-bold text-[#666]">Zoom (Thu/Phóng)</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-editorial-accent"
            />
          </div>
          <button
            onClick={handleApply}
            disabled={isProcessing}
            className="bg-editorial-accent text-white py-4 px-12 uppercase text-[10px] tracking-[4px] font-bold hover:bg-editorial-accent/90 transition-all disabled:opacity-50 w-full md:w-auto"
          >
            {isProcessing ? 'Đang Xử Lý...' : 'Áp Dụng'}
          </button>
        </div>
      </div>
    </div>
  )
}
