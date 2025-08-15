// app.js
// This script handles the dynamic loading of content,
// table of contents generation, and browser history management.
document.addEventListener('DOMContentLoaded', () => {
    const tocSidebar = document.getElementById('toc-sidebar');
    const mainContent = document.getElementById('main-content');
    let h5pInstances = []; // To keep track of H5P instances for cleanup
    let currentPath = window.location.pathname; // Store the current path

    // Function to load and render H5P content
    const renderH5pContent = () => {
        // Clear any existing H5P instances to prevent memory leaks
        h5pInstances.forEach(instance => instance.remove());
        h5pInstances = [];

        // Find all H5P containers in the new content
        const h5pContainers = mainContent.querySelectorAll('.h5p-content');

        h5pContainers.forEach(container => {
            const h5pPath = container.dataset.h5pPath;
            if (h5pPath) {
                const h5pConfig = {
                    h5p: {
                        library: "H5P.InteractiveBook-1.20",
                        url: h5pPath
                    }
                };

                // Initialize the H5P player
                const h5pInstance = new H5P.Player(container, h5pConfig);
                h5pInstances.push(h5pInstance);
            }
        });
    };

    // Helper function to update the active link in the sidebar
    const updateActiveLink = (newPath) => {
        // Remove 'active-link' class from all links
        document.querySelectorAll('#toc-sidebar a').forEach(link => {
            link.classList.remove('active-link');
            // Reset to default class
            link.className = "block px-4 py-2 text-base font-medium text-gray-400 hover:bg-gray-700 hover:text-white rounded-md transition-colors duration-200";
        });
        // Add 'active-link' class to the matching link
        const matchingLink = document.querySelector(`[data-file-path="${newPath}"]`);
        if (matchingLink) {
            matchingLink.classList.add('active-link');
            matchingLink.className = "block px-4 py-2 text-lg font-bold bg-gray-700 text-yellow-400 rounded-md transition-colors duration-200";
        }
    };

    // Make loadChapter a global function by attaching it to the window object
    window.loadChapter = async (file, updateHistory = true) => {
        // Normalize the file path
        const normalizedFile = file.startsWith('/') ? file : `/${file}`;
        currentPath = normalizedFile;
        try {
            const response = await fetch(normalizedFile);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const htmlContent = await response.text();
            mainContent.innerHTML = htmlContent;
            // After loading the content, render the H5P items
            renderH5pContent();
            // Scroll to the top of the content area
            mainContent.scrollTo({ top: 0, behavior: 'smooth' });

            // Update the browser's URL and history
            if (updateHistory) {
                const title = getTitleFromFilePath(normalizedFile);
                history.pushState({ path: normalizedFile }, title, normalizedFile);
            }
            updateActiveLink(normalizedFile);
        } catch (error) {
            mainContent.innerHTML = `<p class="text-red-500">Error loading content: ${error.message}</p>`;
            console.error('Failed to load chapter content:', error);
        }
    };

    // Handle browser's back/forward buttons
    window.onpopstate = (event) => {
        if (event.state && event.state.path) {
            loadChapter(event.state.path, false);
        } else {
            // Fallback to loading a default page, e.g., the introduction
            loadTOC().then(() => {
                const firstChapter = document.querySelector('#toc-sidebar a[data-file-path]');
                if (firstChapter) {
                    loadChapter(firstChapter.dataset.filePath, false);
                }
            });
        }
    };

    // Helper function to get a clean title from a file path
    const getTitleFromFilePath = (filePath) => {
        const pathParts = filePath.split('/');
        const fileName = pathParts[pathParts.length - 1];
        return fileName.split('.')[0].replace(/%20/g, ' ');
    };

    // Helper function to separate root files from folder-grouped files
    const separateFilesByFolder = (files) => {
        const rootFiles = [];
        const folderGroups = {};
        files.forEach(item => {
            const pathParts = item.file.split('/');
            // A file is considered a "root" file if its path has only two parts: 'content' and 'filename.html'
            if (pathParts.length === 2) {
                rootFiles.push(item);
            } else {
                const folderName = pathParts[pathParts.length - 2];
                if (!folderGroups[folderName]) {
                    folderGroups[folderName] = [];
                }
                folderGroups[folderName].push(item);
            }
        });
        return { rootFiles, folderGroups };
    };

    // Load the TOC from the JSON file
    window.loadTOC = async () => {
        try {
            const response = await fetch('/contents.json');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const contents = await response.json();

            const { rootFiles, folderGroups } = separateFilesByFolder(contents);

            tocSidebar.innerHTML = '';
            const tocList = document.createElement('ul');
            tocList.className = "list-none space-y-2";
            
            rootFiles.forEach(item => {
                const listItem = document.createElement('li');
                const link = document.createElement('a');
                link.href = '#';
                link.textContent = getTitleFromFilePath(item.file);
                link.className = "block px-4 py-2 text-lg font-medium text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-colors duration-200";
                link.dataset.filePath = `/${item.file}`; // Store the file path for history API
                
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    loadChapter(item.file);
                });
                
                listItem.appendChild(link);
                tocList.appendChild(listItem);
            });

            Object.keys(folderGroups).forEach(folderName => {
                const folderItems = folderGroups[folderName];

                const parentItem = document.createElement('li');
                
                const parentHeader = document.createElement('div');
                parentHeader.textContent = folderName;
                parentHeader.className = "flex items-center justify-between px-4 py-2 text-lg font-bold cursor-pointer text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-colors duration-200";

                const chevron = document.createElement('span');
                chevron.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transform transition-transform" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                                      </svg>`;
                parentHeader.appendChild(chevron);
                
                const subList = document.createElement('ul');
                subList.className = "pl-6 space-y-1 mt-1 hidden"; // Initially hidden

                parentHeader.addEventListener('click', () => {
                    subList.classList.toggle('hidden');
                    chevron.classList.toggle('rotate-180');
                });
                
                folderItems.forEach(chapter => {
                    const subListItem = document.createElement('li');
                    const link = document.createElement('a');
                    link.href = '#';
                    link.textContent = getTitleFromFilePath(chapter.file);

                    link.className = "block px-4 py-2 text-base font-medium text-gray-400 hover:bg-gray-700 hover:text-white rounded-md transition-colors duration-200";
                    link.dataset.filePath = `/${chapter.file}`; // Store the file path for history API
                    
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        loadChapter(chapter.file);
                    });
                    subListItem.appendChild(link);
                    subList.appendChild(subListItem);
                });
                
                parentItem.appendChild(parentHeader);
                parentItem.appendChild(subList);
                tocList.appendChild(parentItem);

            });

            tocSidebar.appendChild(tocList);
            
            // Check if a specific chapter is requested via URL
            const urlPath = window.location.pathname;
            const requestedFile = contents.find(item => `/${item.file}` === urlPath);
            const aboutPage = `./header/a_propos.html`;
            
            if (urlPath === aboutPage) {
                loadChapter(aboutPage, false);
            } else if (requestedFile) {
                loadChapter(requestedFile.file, false);
            } else if (rootFiles.length > 0) {
                // If not, load the first chapter
                loadChapter(rootFiles[0].file, false);
            } else if (Object.keys(folderGroups).length > 0) {
                const firstFolder = Object.keys(folderGroups)[0];
                if (folderGroups[firstFolder].length > 0) {
                    loadChapter(folderGroups[firstFolder][0].file, false);
                }
            }

        } catch (error) {
            tocSidebar.innerHTML = `<p class="text-red-500">Error loading TOC: ${error.message}</p>`;
            console.error('Failed to load TOC:', error);
        }
    };

    // Start the process by loading the TOC
    loadTOC();
});
