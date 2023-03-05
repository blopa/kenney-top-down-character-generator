// eslint-disable-next-line import/prefer-default-export
export function getBase64(file) {
    return new Promise((resolve, reject) => {
        let contents = '';
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.addEventListener('load', (e) => {
            contents = e.target.result;
            resolve(contents);
        });

        reader.onerror = (e) => {
            reject(e);
        };
    });
}
