<div id="top"></div>
<!--
*** Thanks for checking out the Best-README-Template. If you have a suggestion
*** that would make this better, please fork the repo and create a pull request
*** or simply open an issue with the tag "enhancement".
*** Don't forget to give the project a star!
*** Thanks again! Now go create something AMAZING! :D
-->


<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/MaxRStevens-1/3D-WebGL-SPACE">
    <img src="readme_sources/Sun Earth and MoonPNG.PNG" alt="Logo" width="800" height="800">
  </a>

<h3 align="center">WebGL Scale Solar System</h3>

  <p align="center">
    This is an 3D WebGL based Solar System Simulator
    <br />
    <br />
    <br />
    ·
    <a href="https://github.com/MaxRStevens-1/3D-WebGL-SPACE/issues">Report Bug</a>
    ·
    <a href="https://github.com/MaxRStevens-1/3D-WebGL-SPACE/issues">Request Feature</a>
  </p>
</div>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

[![Product Name Screen Shot][product-screenshot]](https://github.com/MaxRStevens-1/3D-WebGL-SPACE/blob/master/readme_sources/Ship%20Juipter.PNG)

This is an Node Javascript WebGL project, no Three or Babylon, which creates an fully explorable 3D representation of our Solar System, complete with views of all 8 planets, various moons, and gravity. The time scale is 1:1440 and the size of planets in comparison to their orbits is roughly 1:1. Feel free to explore and use this in any way wanted.

<p align="right">(<a href="#top">back to top</a>)</p>



### Built With

  [Node.js](https://nodejs.org/en/download/)
  
  
  [WebGL](https://get.webgl.org/)


### Prerequisites

This is an example of how to list things you need to use the software and how to install them.
* npm
  ```sh
  npm install npm@latest -g
  ```

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/MaxRStevens-1/3D-WebGL-SPACE.git
   ```
2. Install [Node.js](https://nodejs.org/en/download/)
3. Navigate to repo in the directory and use the command 
  ```sh
  npm install vite
  ```
5. After finished download run command
  ```sh
  npm run start
  ```
<p align="right">(<a href="#top">back to top</a>)</p>



<!-- USAGE EXAMPLES -->
## Usage

Start the program by navigating to the directory it is locating in, following the steps in the installation guide, and running the command "npm run start".

Using the player ship view, movement is applied to forward, right, and up vectors based on wasd movement. Change Player orientation using the mouse or trackpad. Spacebar will set the current rotational and movement velocity to 0. Watch out for gravity, or attempt to get youself into an orbit around an planet. Use the +/- keys to zoom in and out.

Pressing any number jey from 0-8, you can move yourself around the various planets and their moons in the Solar System. Pressing the same number again will cycle the camera to rotate around an moon from the parent object. 0 selects the Sun, 1 selects Mercury, and so on. Rotate yourself around the planet or moon using the mouse / trackpad. Use the +/- keys to zoom in and out. Pressing enter will unbind the camera from the currently viewed planet / moon and place the player ship in the cameras current location.

Pressing the 'g' key will display the Spheres of Gravitional Influence of the various objects in the Solar System. 

Pressing the 'h' key will display the axis unaligned bounding box for all objects.

Additional screenshots, code examples and demos work well in this space. You may also link to more resources.


<p align="right">(<a href="#top">back to top</a>)</p>



<!-- ROADMAP -->
## Roadmap

- [ ] Free Camera
- [ ] Fixing visual artifacts at very large distance
- [ ] Reducing oscillation of objects at very large distances

See the [open issues](https://github.com/MaxRStevens-1/3D-WebGL-SPACE/issues) for a full list of proposed features (and known issues).

<p align="right">(<a href="#top">back to top</a>)</p>




<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- CONTACT -->
## Contact

Maxwell Stevens - steve3mr@dukes.jmu.edu

Project Link: [https://github.com/MaxRStevens-1/3D-WebGL-SPACE](https://github.com/MaxRStevens-1/3D-WebGL-SPACE)

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

* My Professor Chris Johnson and his [Textbook](https://howto3d.twodee.org/)
* TigerNDV for his [3D Model Spaceship](https://sketchfab.com/3d-models/mother-spaceship-9e0e86c41ed24676a7c8b25fdfa002c0)
* []()

<p align="right">(<a href="#top">back to top</a>)</p>
