let selectedFile = null;

// Handle file upload area click
document.getElementById('fileUploadArea').addEventListener('click', (e) => {
    // Prevent event if clicking on upload button
    if (e.target.closest('.upload-button')) { // This checks if the thing the user actually clicked on (e.target) is inside (or is) an element with the class upload-button, closest('.upload-button') searches up the DOM tree to see if any parent (or the element itself) has that class.
        return;
    }
    document.getElementById('csvFile').click(); //If the user did not click on the upload button, then this line is run.It programmatically triggers a click on the element with the ID csvFile. This is typically an <input type="file" id="csvFile">, so clicking it opens the file dialog.
});

// Handle file selection
document.getElementById('csvFile').addEventListener('change', (event) => {
    const file = event.target.files[0];
    
    if (file && file.name.endsWith('.csv')) {
        selectedFile = file;
        console.log('File selected:', file.name);
        document.querySelector('.js-upload-button').disabled = false;
    } else {
        alert("Upload only csv file");
        selectedFile = null;
        document.querySelector('.js-upload-button').disabled = true;
    }
});
// Handle upload button click
document.querySelector('.js-upload-button').addEventListener('click', (e) => {

    e.stopPropagation(); // Prevent event bubbling
    
    if (!selectedFile) {
        alert("Please select a file first");
        return;
    }
    // Log file data
    const fileData = {
        file_name: selectedFile.name,
        time: new Date(selectedFile.lastModified)
    };
    console.log(fileData);

    // Upload file
    const formData = new FormData();
    formData.append("csv_file", selectedFile);

    fetch("http://localhost:5500/upload", {
        method: "POST",
        body: formData,
    })
    .then((response) => response.json())
    .then((data) => {
        console.log('Upload successful:', data);
    })
    .catch(error => {
        console.error('Upload failed:', error);
    });
});

document.querySelector('.js-text-upload-link').
    addEventListener('click', () => {
        const inputField = document.getElementById('textInput');
        const inputText = inputField.value;
        console.log(inputText);

        const textData = {
            textInfo: inputText
        }
        fetch("http://localhost:5500/upload_api", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(textData)
        })
        .then((response) => {
            response.json();
        })
        .then((data) => {
            console.log("Upload successfull", data);
        })
        .catch((error) => {
            console.log("Unexpected error occured", error);
        });
    });