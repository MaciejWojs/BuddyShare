<script lang="ts" setup></script>

<template>
  <div class="about-container">
    <div class="github-link">
      <a
        href="https://github.com/MaciejWojs/BuddyShare"
        target="_blank"
        rel="noopener noreferrer"
      >
        View on GitHub
      </a>
    </div>

    <div class="creators-section">
      <h2>About BuddyShare</h2>
      <p>Page created by 2 students for an academic project:</p>
      <div class="creators">
        <div class="creator">Arkadiusz R</div>
        <div class="creator">Maciej W</div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.about-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

.github-link {
  margin-bottom: 2rem;

  a {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background-color: #24292e;
    color: white;
    text-decoration: none;
    border-radius: 4px;
    font-weight: 600;
    transition: background-color 0.3s;

    &:hover {
      background-color: #0366d6;
    }
  }
}

.creators-section {
  margin-top: 3rem;

  h2 {
    margin-bottom: 1rem;
    font-size: 1.8rem;
  }

  p {
    margin-bottom: 1.5rem;
    font-size: 1.1rem;
  }

  .creators {
    display: flex;
    justify-content: center;
    gap: 2rem;

    .creator {
      font-weight: 600;
      font-size: 1.2rem;
    }
  }
}
</style>
