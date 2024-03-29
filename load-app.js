const RSS_URL = `https://ici.radio-canada.ca/rss/4159`;

console.log("starting")


async function fetchRss(){
  return fetch(RSS_URL)
    .then(response => response.text())
    .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
    .then(data => {
      // console.log(data);
      const items = [...data.querySelectorAll("item")
                    ];
      let html = ``;
      items.forEach(el => {
        // console.log(el)
        const article = {
          image: el.querySelector("enclosure")?el.querySelector("enclosure").getAttribute("url"):"https://images.radio-canada.ca/v1/infolettres/logo/perso/info-nationale-infolettre.jpg",
          title: el.querySelector("title").childNodes[0].nodeValue,
          description: el.querySelector("description").childNodes[0].nodeValue,
          link: el.querySelector("link").childNodes[0].nodeValue
        }
        
        html += `
          <article class="col">
              <div class="card h-100">
                  <div >
                      <img style="object-fit: fill;" class="card-img-top" src="${article.image}" alt="">
                  </div>
                  <div class="card-body">
                      <h5 class="card-title">
                          
                              ${article.title}
                          
                      </h5>
                      <div class="card-text">
                          ${article.description}
                      </div>
                  </div>
                  <div class="card-footer">
                      <a href="${article.link}" class="btn btn-primary">Voir la nouvelle</a>
                  </div> 
              </div>   
          </article>
        `;
      });
      document.getElementById('content').insertAdjacentHTML("beforeend", html);
    });
  }

  //If the fetch fail, that mean we are offline. Reload to show the Offline Page.
  fetchRss().catch(()=>{location.reload()})
