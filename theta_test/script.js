document.addEventListener('DOMContentLoaded', () => {
    const createStreamButton = document.getElementById('createStream');
    const listIngestorsButton = document.getElementById('listIngestors');
    const selectIngestorButton = document.getElementById('selectIngestor');
    const streamInfoDiv = document.getElementById('streamInfo');
    let videoPlayer;

    let streamId;
    let ingestorId;

    const apiBaseUrl = 'https://api.thetavideoapi.com';
    const serviceAccountId = 'srvacc_s7fdhd03ey47a3jby93vm4cae'; // Replace with your service account ID
    const serviceAccountSecret = 'c2ud7ga8k0at8pbib55vdh1wg35bdnh1'; // Replace with your service account secret

    createStreamButton.addEventListener('click', () => {
        fetch(`${apiBaseUrl}/stream`, {
            method: 'POST',
            headers: {
                'x-tva-sa-id': serviceAccountId,
                'x-tva-sa-secret': serviceAccountSecret,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: 'demo' })
        })
        .then(response => response.json())
        .then(data => {
            streamId = data.body.id;
            streamInfoDiv.innerHTML = `Livestream created with ID: ${streamId}`;
        })
        .catch(error => console.error('Error:', error));
    });

    listIngestorsButton.addEventListener('click', () => {
        fetch(`${apiBaseUrl}/ingestor/filter`, {
            method: 'GET',
            headers: {
                'x-tva-sa-id': serviceAccountId,
                'x-tva-sa-secret': serviceAccountSecret
            }
        })
        .then(response => response.json())
        .then(data => {
            const ingestors = data.body.ingestors;
            ingestorId = ingestors[0].id; // Selecting the first ingestor for simplicity
            streamInfoDiv.innerHTML = `Available Edge Ingestor ID: ${ingestorId}`;
        })
        .catch(error => console.error('Error:', error));
    });

    selectIngestorButton.addEventListener('click', () => {
        if (!streamId || !ingestorId) {
            streamInfoDiv.innerHTML = 'Please create a stream and list ingestors first.';
            return;
        }

        fetch(`${apiBaseUrl}/ingestor/${ingestorId}/select`, {
            method: 'PUT',
            headers: {
                'x-tva-sa-id': serviceAccountId,
                'x-tva-sa-secret': serviceAccountSecret,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tva_stream: streamId })
        })
        .then(response => response.json())
        .then(data => {
            const { stream_server, stream_key } = data.body;
            streamInfoDiv.innerHTML = `Stream Server: ${stream_server}<br>Stream Key: ${stream_key}`;

            // Inform the user to start streaming from OBS now
            streamInfoDiv.innerHTML += '<br>Please start streaming from OBS using the above server and key.';

            // Polling to check if the stream is live
            const interval = setInterval(() => {
                fetch(`${apiBaseUrl}/stream/${streamId}`, {
                    method: 'GET',
                    headers: {
                        'x-tva-sa-id': serviceAccountId,
                        'x-tva-sa-secret': serviceAccountSecret
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.body.status === 'on') {
                        clearInterval(interval); // Stop polling

                        // Retrieve and set the HLS URL from the stream details
                        const hlsUrl = data.body.playback_uri; // Assuming playback_uri has the correct HLS URL
                        console.log('HLS URL:', hlsUrl); // Log the HLS URL to verify

                        // Initialize Video.js with Theta integration
                        videoPlayer = videojs('my-player', {
                            autoplay: true,
                            muted: false,
                            techOrder: ["theta_hlsjs", "html5"],
                            sources: [{
                                src: hlsUrl,
                                type: "application/vnd.apple.mpegurl",
                                label: "auto"
                            }],
                            theta_hlsjs: {
                                streamId: streamId,
                                userId: "", // Optionally add user ID if required
                                walletUrl: "wss://api-wallet-service.thetatoken.org/theta/ws",
                                onWalletAccessToken: null,
                                hlsOpts: null
                            }
                        });

                        videoPlayer.ready(function() {
                            console.log('Video.js player is ready');
                            videoPlayer.play().catch(error => {
                                console.error('Error playing the video:', error);
                            });
                        });

                        // Force a refresh on the video player source to ensure it's loaded correctly
                        videoPlayer.src({ type: 'application/vnd.apple.mpegurl', src: hlsUrl });
                        videoPlayer.load();
                    }
                })
                .catch(error => console.error('Error:', error));
            }, 5000); // Poll every 5 seconds
        })
        .catch(error => console.error('Error:', error));
    });
});
