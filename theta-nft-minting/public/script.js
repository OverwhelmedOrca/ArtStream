document.getElementById('uploadForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const response = await fetch('/upload', {
      method: 'POST',
      body: formData
    });
    const result = await response.json();
    document.getElementById('result').innerText = JSON.stringify(result);
  });
  