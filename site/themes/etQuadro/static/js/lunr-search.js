window.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("search");
    const input = document.getElementById("search-input");
    const status = document.getElementById("search-status");
    const target = document.getElementById("main");
    const originalTitle = document.title;
    let originalContent = null;
    let indexPromise = null;
    let generation = 0;

    function loadIndex() {
        if (!indexPromise) {
            indexPromise = fetch("/search.json", { signal: AbortSignal.timeout(15000) })
                .then(response => {
                    if (!response.ok) throw new Error("Search index unavailable");
                    return response.json();
                })
                .then(documents => {
                    if (!Array.isArray(documents)) throw new Error("Invalid search index");
                    const lookup = new Map();
                    const index = lunr(function() {
                        this.ref("uri");
                        for (const field of ["title", "subtitle", "content", "description", "categories", "authors", "tags"]) {
                            this.field(field);
                        }
                        for (const document of documents) {
                            this.add(document);
                            lookup.set(document.uri, document);
                        }
                    });
                    return { index, lookup };
                })
                .catch(error => {
                    indexPromise = null;
                    throw error;
                });
        }
        return indexPromise;
    }

    async function startSearch(term, keepURL) {
        const current = ++generation;
        input.value = term;
        status.textContent = "Searching…";
        form.setAttribute("data-running", "true");
        try {
            const { index, lookup } = await loadIndex();
            if (current !== generation) return;
            const results = index.search(term);
            const content = document.createElement("div");
            content.id = "content";
            const contentIn = document.createElement("div");
            contentIn.id = "content-in";
            const post = document.createElement("div");
            post.className = "post";
            const title = document.createElement("h1");
            title.id = "search-results";
            title.className = "title";
            title.textContent = results.length === 0 ? `No results found for “${term}”`
                : `Found ${results.length === 1 ? "one result" : `${results.length} results`} for “${term}”`;
            post.appendChild(title);

            const template = document.getElementById("search-result-template");
            for (const result of results) {
                const doc = lookup.get(result.ref);
                const element = template.content.cloneNode(true);
                element.querySelector(".summary-title-link").href = doc.uri;
                element.querySelector(".read-more-link").href = doc.uri;
                element.querySelector(".summary-title-link").textContent = doc.title;
                element.querySelector(".summary").textContent = truncateToEndOfSentence(doc.content, 70);
                post.appendChild(element);
            }
            const bottom = document.createElement("div");
            bottom.className = "bottomthing";
            contentIn.append(post, bottom);
            content.appendChild(contentIn);

            if (!originalContent) originalContent = Array.from(target.childNodes);
            target.replaceChildren(content);
            document.title = title.textContent;
            status.textContent = title.textContent;
            if (!keepURL) {
                history.pushState(null, "", "#search=" + encodeURIComponent(term));
            }
            title.scrollIntoView(true);
        } catch (error) {
            if (current !== generation) return;
            status.textContent = error.name === "QueryParseError"
                ? "Invalid search query. Check the syntax and try again."
                : "Search could not load. Please retry.";
        } finally {
            if (current === generation) form.removeAttribute("data-running");
        }
    }

    function restoreFromURL() {
        // Invalidate pending work even when the original DOM has not been replaced yet.
        generation++;
        form.removeAttribute("data-running");
        status.textContent = "";
        if (location.hash.startsWith("#search=")) {
            try {
                const term = decodeURIComponent(location.hash.slice(8)).trim();
                if (term) {
                    startSearch(term, true);
                    return;
                }
            } catch (_) {
                status.textContent = "Invalid search query URL.";
            }
        }
        if (originalContent) {
            target.replaceChildren(...originalContent);
            originalContent = null;
        }
        document.title = originalTitle;
        input.value = "";
    }

    form.addEventListener("submit", event => {
        event.preventDefault();
        const term = input.value.trim();
        if (term) startSearch(term, false);
    });
    window.addEventListener("popstate", restoreFromURL);
    window.addEventListener("hashchange", restoreFromURL);
    restoreFromURL();

    // Match Hugo summaries by extending the minimum word count to a sentence boundary.
    function truncateToEndOfSentence(text, minWords) {
        let match;
        let result = "";
        let wordCount = 0;
        const regexp = /(\S+)(\s*)/g;
        while ((match = regexp.exec(text))) {
            wordCount++;
            result += match[0];
            if (wordCount > minWords && (/[.?!"]$/.test(match[1]) || match[2].startsWith("\n"))) break;
        }
        return result;
    }
}, { once: true });
