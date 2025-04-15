import react from 'react'

export default function ImageUploading() {
  const [imageUrl, setImageUrl] = react.useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    const url = URL.createObjectURL(file);
    setImageUrl(url);
  }

  return (
    <div className='flex justify-center items-center h-dvh flex-1 bg-gray-200 flex-col'>
      <h1 className="text-2xl font-bold">Image Uploading</h1>

      <div className="flex flex-col gap-4 mt-4">
        <input className="bg-amber-500 w-min cursor-pointer" multiple type="file" accept="image/*" onChange={handleImageChange} />
        {imageUrl && <img src={imageUrl} alt="Uploaded Image" width={300} />}
      </div>

    </div>
  )
}