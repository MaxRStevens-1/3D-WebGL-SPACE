/**
 * reads un file to json
 * @param {File} file 
 * @returns 
 */
 export async function readObjFromFile (file) {
    var obj =  await fetch(file).then(response => response.text()) 
    return obj
  }
  

  /**
 * self explanitory
 * @param {String} url
 * @returns
 */
export async function readImage(url) {
    const image = new Image()
    image.src = url
    await image.decode()
    return image
  }