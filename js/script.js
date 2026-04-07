const container = document.getElementById("courses");

courses.forEach(course => {
  const div = document.createElement("div");

  div.innerHTML = `
    <h2>${course.title}</h2>
    <p>${course.description}</p>

    ${course.videos.map(video => `
      <iframe width="300" height="200"
      src="${video.link}" frameborder="0"
      allowfullscreen></iframe>
      <p>${video.name}</p>
    `).join("")}
  `;

  container.appendChild(div);
});