# Step 1: Use a standard Node.js base image
FROM node:18-bookworm

# Step 2: Set environment to prevent interactive prompts during installation
ENV DEBIAN_FRONTEND=noninteractive

# Step 3: Install system dependencies including LibreOffice, Ghostscript, and essential fonts
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libreoffice \
    ghostscript \
    unzip \
    fonts-liberation \
    fonts-noto-core \
    fonts-croscore \
    fonts-crosextra-carlito \
    fonts-crosextra-caladea \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Step 4: Set the working directory for the application
WORKDIR /usr/src/app

# Step 5: Copy custom fonts from your project into the container
COPY fonts/ /usr/share/fonts/truetype/custom/

# Step 6: Update the system's font cache to recognize the new fonts
RUN fc-cache -f -v

# Step 7: Copy package files and install dependencies. This layer is cached
# unless package.json or package-lock.json changes.
COPY package*.json ./
RUN npm install

# Step 8: Copy the rest of your application code
COPY . .

# Step 9: Expose the port the application will run on
EXPOSE 3000

# Step 10: Define the command to start the server
CMD [ "node", "server.js" ]
