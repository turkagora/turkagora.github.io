// app.js
document.addEventListener('DOMContentLoaded', () => {

    // --- State and DOM Elements ---
    const mainContent = document.getElementById('main-content');
    const tocSidebar = document.getElementById('toc-sidebar');
    let h5pInstances = []; // To keep track of H5P instances for cleanup
    
    // Get the GitHub repository name from the URL path
    const state = {
        repoName: window.location.pathname.split('/')[1] || ''
    };

    // --- Core Functions ---

    /**
     * Renders H5P content within the main content area.
     */
    const renderH5pContent = () => {
        // Clear any existing H5P instances to prevent memory leaks
        h5pInstances.forEach(instance => instance.remove());
        h5pInstances = [];
    
        const h5pContainers = mainContent.querySelectorAll('.h5p-content');
    
        h5pContainers.forEach(container => {
            const h5pPath = container.dataset.h5pPath;
            if (h5pPath) {
                // Initialize the H5P player
                const h5pInstance = new H5P.Player(container, {
                    h5p: {
                        library: "H5P.InteractiveBook-1.20",
                        url: h5pPath
                    }
                });
                h5pInstances.push(h5pInstance);
            }
        });
    };
    
    /**
     * Updates the active link in the Table of Contents sidebar.
     * @param {string} newPath The path of the currently loaded chapter.
     */
    const updateActiveLink = (newPath) => {
        // Reset all links to their default style
        document.querySelectorAll('#toc-sidebar a').forEach(link => {
            link.className = "block px-4 py-2 text-base font-medium text-gray-400 hover:bg-gray-700 hover:text-white rounded-md transition-colors duration-200";
        });

        // Find and style the active link
        const matchingLink = document.querySelector(`[data-file-path="${newPath}"]`);
        if (matchingLink) {
            matchingLink.className = "block px-4 py-2 text-lg font-bold bg-gray-700 text-yellow-400 rounded-md transition-colors duration-200";
            // Expand parent folder if link is nested
            const parentSublist = matchingLink.closest('ul.pl-6');
            if (parentSublist) {
                parentSublist.classList.remove('hidden');
                const chevron = parentSublist.previousElementSibling.querySelector('svg');
                if (chevron) {
                    chevron.classList.add('rotate-180');
                }
            }
        }
    };

    /**
     * Loads and displays a chapter's content.
     * @param {string} filePath The relative path to the chapter file.
     * @param {boolean} updateHistory Whether to update the browser history.
     */
    const loadChapter = async (filePath, updateHistory = true) => {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const htmlContent = await response.text();
            mainContent.innerHTML = htmlContent;

            renderH5pContent();
            mainContent.scrollTo({ top: 0, behavior: 'smooth' });

            if (updateHistory) {
                const title = getTitleFromFilePath(filePath);
                const urlForHistory = `/${state.repoName}/${filePath}`;
                history.pushState({ path: filePath }, title, urlForHistory);
            }
            updateActiveLink(filePath);

        } catch (error) {
            mainContent.innerHTML = `<p class="text-red-500">Error loading content: ${error.message}</p>`;
            console.error('Failed to load chapter content:', error);
        }
    };
    
    /**
     * Gets a clean, human-readable title from a file path.
     * @param {string} filePath The path to the file.
     * @returns {string} The formatted title.
     */
    const getTitleFromFilePath = (filePath) => {
        const pathParts = filePath.split('/');
        const fileName = pathParts[pathParts.length - 1];
        return decodeURIComponent(fileName.split('.')[0].replace(/%20/g, ' '));
    };

    /**
     * Separates files into root files and folder-grouped files.
     * @param {Array<Object>} files The list of file objects from the JSON.
     * @returns {{rootFiles: Array, folderGroups: Object}} The separated file lists.
     */
    const separateFilesByFolder = (files) => {
        const rootFiles = [];
        const folderGroups = {};

        files.forEach(item => {
            const pathParts = item.file.split('/');
            // A file is considered a "root" file if its path is not within a subfolder
            if (pathParts.length === 2 && pathParts[0] === 'content') {
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
    
    /**
     * Loads and generates the Table of Contents from a JSON file.
     */
    const loadTOC = async () => {
        try {
            const response = await fetch('contents.json');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const contents = await response.json();
            const { rootFiles, folderGroups } = separateFilesByFolder(contents);

            const fragment = document.createDocumentFragment();
            const tocList = document.createElement('ul');
            tocList.className = "list-none space-y-2";
            
            // Render root files
            rootFiles.forEach(item => {
                const link = createTocLink(item.file);
                const listItem = document.createElement('li');
                listItem.appendChild(link);
                tocList.appendChild(listItem);
            });

            // Render folder groups
            Object.keys(folderGroups).forEach(folderName => {
                const folderItems = folderGroups[folderName];
                const parentItem = createFolderSection(folderName, folderItems);
                tocList.appendChild(parentItem);
            });

            fragment.appendChild(tocList);
            tocSidebar.innerHTML = '';
            tocSidebar.appendChild(fragment);

            // Determine which chapter to load on initial page visit
            handleInitialPageLoad(contents, rootFiles, folderGroups);

        } catch (error) {
            tocSidebar.innerHTML = `<p class="text-red-500">Error loading TOC: ${error.message}</p>`;
            console.error('Failed to load TOC:', error);
        }
    };

    /**
     * Creates a single TOC link element.
     * @param {string} filePath The path to the chapter file.
     * @returns {HTMLAnchorElement} The created link element.
     */
    const createTocLink = (filePath, isSublink = false) => {
        const link = document.createElement('a');
        link.href = '#';
        link.textContent = getTitleFromFilePath(filePath);
        link.className = isSublink
            ? "block px-4 py-2 text-base font-medium text-gray-400 hover:bg-gray-700 hover:text-white rounded-md transition-colors duration-200"
            : "block px-4 py-2 text-lg font-medium text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-colors duration-200";
        link.dataset.filePath = filePath;
        return link;
    };

    /**
     * Creates a folder section with a collapsible sub-list.
     * @param {string} folderName The name of the folder.
     * @param {Array<Object>} items The list of chapters in the folder.
     * @returns {HTMLLIElement} The parent list item element.
     */
    const createFolderSection = (folderName, items) => {
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
        subList.className = "pl-6 space-y-1 mt-1 hidden";

        parentHeader.addEventListener('click', () => {
            subList.classList.toggle('hidden');
            chevron.classList.toggle('rotate-180');
        });
        
        items.forEach(chapter => {
            const subListItem = document.createElement('li');
            const link = createTocLink(chapter.file, true);
            subListItem.appendChild(link);
            subList.appendChild(subListItem);
        });
        
        parentItem.appendChild(parentHeader);
        parentItem.appendChild(subList);
        return parentItem;
    };

    /**
     * Determines and loads the correct chapter on initial page load.
     * @param {Array<Object>} contents The full list of contents.
     * @param {Array<Object>} rootFiles The list of root files.
     * @param {Object} folderGroups The object of folder-grouped files.
     */
    const handleInitialPageLoad = (contents, rootFiles, folderGroups) => {
        const urlPath = window.location.pathname.replace(`/${state.repoName}/`, '');
        const requestedFile = contents.find(item => item.file === urlPath);

        if (requestedFile) {
            loadChapter(requestedFile.file, false);
        } else if (rootFiles.length > 0) {
            loadChapter(rootFiles[0].file, false);
        } else if (Object.keys(folderGroups).length > 0) {
            const firstFolder = Object.keys(folderGroups)[0];
            if (folderGroups[firstFolder].length > 0) {
                loadChapter(folderGroups[firstFolder][0].file, false);
            }
        }
    };

    // --- Event Listeners and Initializers ---

    // Handle browser's back/forward buttons
    window.onpopstate = (event) => {
        if (event.state && event.state.path) {
            loadChapter(event.state.path, false);
        } else {
            // Fallback to loading the initial default page
            const firstChapter = document.querySelector('#toc-sidebar a[data-file-path]');
            if (firstChapter) {
                loadChapter(firstChapter.dataset.filePath, false);
            }
        }
    };
    
    // Add event delegation to the entire TOC sidebar for click events
    tocSidebar.addEventListener('click', (e) => {
        // Find the closest ancestor that is an anchor tag
        const link = e.target.closest('a[data-file-path]');
        if (link) {
            e.preventDefault();
            loadChapter(link.dataset.filePath);
        }
    });

    // Start the process by loading the TOC
    loadTOC();
});
