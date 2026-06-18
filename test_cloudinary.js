const formData = new FormData();
// A tiny 1x1 base64 GIF
const base64Image = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
formData.append("file", base64Image);
formData.append("upload_preset", "TreViet");

fetch("https://api.cloudinary.com/v1_1/dqashtrhn/image/upload", {
  method: "POST",
  body: formData
}).then(res => res.json()).then(console.log).catch(console.error);
