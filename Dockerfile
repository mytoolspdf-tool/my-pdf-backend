# Step 1: Ek complete base image se start karein
FROM node:18-bookworm

# Step 2: Zaroori dependencies, LibreOffice, aur sabhi zaroori fonts install karein
# noninteractive flag se user input nahi maangega
ENV DEBIAN_FRONTEND=noninteractive

# Is baar hum aur bhi zyada font packages install kar rahe hain
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libreoffice \
    ghostscript \
    unzip \
    fonts-liberation \
    fonts-noto-core \
    fonts-croscore \
    # Yeh Microsoft fonts ka ek behtar alternative hai jo EULA nahi maangta
    fonts-crosextra-carlito \
    fonts-crosextra-caladea \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Step 3: Application ke liye ek directory banayein
WORKDIR /usr/src/app

# Step 4: Apne project ke fonts folder se custom fonts ko container mein copy karein
COPY fonts/ /usr/share/fonts/truetype/custom/

# Step 5: System ka font cache update karein
RUN fc-cache -f -v

# Step 6: package.json ko copy karke packages install karein
COPY package.json ./
RUN npm install

# Step 7: Apne project ke baaki code ko copy karein
COPY . .

# Step 8: Application ka port expose karein
EXPOSE 3000

# Step 9: Server ko start karne ke liye command
CMD [ "node", "server.js" ]
