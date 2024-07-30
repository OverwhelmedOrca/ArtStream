## Inspiration
The world of streaming services is vast, catering to various niches like gaming, music, and more. However, there is a significant gap in the market for a platform dedicated to artists who want to collaborate and compete creatively. PalettePals aims to fill this void, offering a unique space for artists to connect, create, and showcase their talents.
## What it does
PalettePals leverages Theta's livestreaming APIs to facilitate streams where artists can collaborate or compete in real-time. Whether it's painting, singing, acting, or stand-up comedy, artists can choose to either collaborate with fellow creatives or engage in friendly competition. Beyond streaming, PalettePals allows artists and users to mint NFTs, which can be images or videos, on the Theta Network. These NFTs can then be sold on our fully functional marketplace. Additionally, we have developed a virtual art gallery where users can experience art in a premium, immersive environment
## How we built it
We utilized ThetaEdgeCloud's livestream APIs to handle the video streaming component. Integrating these APIs required careful handling of video data to ensure low latency and high reliability. For the NFT functionality, we incorporated web3 technology to connect users' wallets. This allows users to mint NFTs directly from their streams or uploads. The contract was deployed on the theta network through theta wallet. To create a visually appealing and interactive 3D environment, we used three.js. This JavaScript library helped us build the virtual gallery where users can walk through and view art pieces in a simulated physical space.For the virtual art gallery, we relied on the OpenVGal library to create a realistic and interactive gallery experience. ur front-end was developed using HTML, CSS, and JavaScript, ensuring a user-friendly interface. We focused on creating a seamless user experience, with intuitive navigation and interactive elements that make it easy for users to stream, mint NFTs, and explore the virtual gallery. Our back-end infrastructure was built to handle high volumes of data and transactions securely and efficiently. We used robust server technologies to manage user data, streaming content, and marketplace transactions, ensuring the platform's reliability and scalability.
## Challenges we ran into
One of the major challenges was deploying the NFT minting contracts, as this was our first foray into building a fully functional marketplace. Creating the virtual gallery also demanded significant effort and customization to ensure a premium user experience. Ensuring seamless video display and stream quality was another hurdle that required extensive bug fixing and optimization.
## Accomplishments that we're proud of
We are incredibly proud of successfully building a comprehensive streaming platform that integrates an NFT marketplace and a virtual art gallery. This project represents a significant achievement in merging art, technology, and blockchain, providing a unique platform for artists.
## What we learned
Throughout this project, we gained extensive knowledge in web3 development and Theta blockchain services. This experience has not only enhanced our technical skills but also opened up new possibilities for future projects involving blockchain and streaming technologies.

## What's next for PalettePals
Looking ahead, we plan to introduce more interactive features, such as real-time collaboration tools and enhanced community engagement options. We also aim to expand our marketplace to include more diverse forms of art and creativity. Additionally, we are exploring partnerships with established artists and art institutions to bring more visibility and credibility to PalettePals. Ultimately, our goal is to make PalettePals the go-to platform for artists worldwide to collaborate, compete, and showcase their talents in innovative ways.


To test it, from the terminal in your root terminal, run command:
 ```node server.js```
 
