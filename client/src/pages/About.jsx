import aboutBanner from '../assets/about-banner.jpg'
import b1 from '../assets/b1.webp';
import b2 from '../assets/B2.webp';
import b3 from '../assets/B3.webp';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';

const About = () => {
  return (
    <>

    < Navbar />

    <div className="bg-white px-8 md:px-16 py-4 md:py-8">
      {/* Hero Section */}
      <div className="relative">
        <img
          src={aboutBanner} // Replace with your image source
          alt="Vintage Car"
          className="w-full h-80 md:h-[500px] object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-10">
          <h1 className="text-white text-4xl md:text-6xl font-bold">WHO WE ARE</h1>
        </div>
      </div>

      {/* Content Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        {/* Purpose Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">OUR PURPOSE</h2>
          <p className="text-gray-700">
            We are a premier auction platform offering exclusive items and
            collectibles, tailored for discerning buyers who value uniqueness
            and quality. Our mission is to connect sellers and buyers seamlessly,
            providing a trusted space for auctions and fixed-price sales.
          </p>
        </div>
        <div>
          <img
            src={b1} // Replace with your image source
            alt="Purpose"
            className="w-full h-auto rounded shadow-md"
          />
        </div>

        {/* Background Section */}
        <div>
          <img
            src={b2} // Replace with your image source
            alt="Background"
            className="w-full h-auto rounded shadow-md"
          />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4">BACKGROUND</h2>
          <p className="text-gray-700">
            Founded in 2025, our platform redefines the auction and sales
            experience for exclusive items and collectibles. Built on the
            principles of trust, transparency, and efficiency, we connect buyers
            and sellers in a seamless marketplace. By leveraging cutting-edge
            technology and providing detailed, honest item descriptions, we
            ensure confidence and satisfaction at every step.
          </p>
        </div>

        {/* Mission Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">OUR MISSION</h2>
          <p className="text-gray-700">
            We are on a mission to connect people with exceptional items that
            transcend trends and stand the test of time. From rare collectibles
            to modern treasures, each piece we feature embodies quality,
            uniqueness, and enduring value.
          </p>
          <p className="mt-4 text-gray-700">
            Whether auctioned or sold at a fixed price, our platform is dedicated
            to celebrating timeless design and creating meaningful connections
            between discerning buyers and passionate sellers.
          </p>
        </div>
        <div>
          <img
            src={b3} // Replace with your image source
            alt="Mission"
            className="w-full h-auto rounded shadow-md"
          />
        </div>
      </div>
    </div>

    < Footer />

    </>
  );
};

export default About;
