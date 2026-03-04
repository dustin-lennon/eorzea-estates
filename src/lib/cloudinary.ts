import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export { cloudinary }

export async function uploadEstateImage(
  file: Buffer,
  folder: string
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: `eorzea-estates/${folder}`,
          resource_type: "image",
          transformation: [
            { width: 1920, height: 1080, crop: "limit", quality: "auto:good" },
          ],
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error("Upload failed"))
            return
          }
          resolve({ url: result.secure_url, publicId: result.public_id })
        }
      )
      .end(file)
  })
}

export async function deleteEstateImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId)
}
