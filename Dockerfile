# Step 1: Use a standard Node.js base image
FROM node:18-bookworm

# Step 2: Set environment to prevent interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Step 3: Install system dependencies. This is the key change.
# We are adding 'libreoffice-writer' and 'default-jre'.
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libreoffice \
    libreoffice-writer \
    default-jre \
    ghostscript \
    unzip \
    fonts-liberation \
    fonts-noto-core \
    fonts-croscore \
    fonts-crosextra-carlito \
    fonts-crosextra-caladea \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Step 4: Set the working directory
WORKDIR /usr/src/app

# Step 5: Copy custom fonts
COPY fonts/ /usr/share/fonts/truetype/custom/

# Step 6: Update the font cache
RUN fc-cache -f -v

# Step 7: Copy package files and install Node.js dependencies
COPY package*.json ./
RUN npm install

# Step 8: Copy the rest of your application code
COPY . .

# Step 9: Expose the application port
EXPOSE 3000

# Step 10: Define the command to start the server
CMD [ "node", "server.js" ]
