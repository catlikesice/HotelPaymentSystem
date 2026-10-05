/**
 * Places that can be searched but do not have a city HTML page.
 * City page_url stays null. Each hotel url is that hotel's own page.
 * Descriptions follow the same "Browse hotels in …" city pattern as the catalog.
 */
module.exports = {
  cities: [
    {
      name: 'Nida',
      country: 'Lithuania',
      description: 'Browse hotels in Nida, Lithuania.'
    },
    {
      name: 'Barentsburg',
      country: 'Svalbard',
      description: 'Browse hotels in Barentsburg, Svalbard.'
    },
    {
      name: 'Pyramiden',
      country: 'Svalbard',
      description: 'Browse hotels in Pyramiden, Svalbard.'
    },
    {
      name: 'Palanga',
      country: 'Lithuania',
      description: 'Browse hotels in Palanga, Lithuania.'
    },
    {
      name: 'Druskininkai',
      country: 'Lithuania',
      description: 'Browse hotels in Druskininkai, Lithuania.'
    },
    {
      name: 'Trakai',
      country: 'Lithuania',
      description: 'Browse hotels in Trakai, Lithuania.'
    },
    {
      name: 'Porvoo',
      country: 'Finland',
      description: 'Browse hotels in Porvoo, Finland.'
    },
    {
      name: 'Kuopio',
      country: 'Finland',
      description: 'Browse hotels in Kuopio, Finland.'
    },
    {
      name: 'Savonlinna',
      country: 'Finland',
      description: 'Browse hotels in Savonlinna, Finland.'
    },
    {
      name: 'Jukkasjärvi',
      country: 'Sweden',
      description: 'Browse hotels in Jukkasjärvi, Sweden.'
    },
    {
      name: 'Gjógv',
      country: 'Faroe Islands',
      description: 'Browse hotels in Gjógv, Faroe Islands.'
    },
    {
      name: 'Saksun',
      country: 'Faroe Islands',
      description: 'Browse hotels in Saksun, Faroe Islands.'
    },
    {
      name: 'Mykines',
      country: 'Faroe Islands',
      description: 'Browse hotels in Mykines, Faroe Islands.'
    },
    {
      name: 'Nólsoy',
      country: 'Faroe Islands',
      description: 'Browse hotels in Nólsoy, Faroe Islands.'
    },
    {
      name: 'Vágar',
      country: 'Faroe Islands',
      description: 'Browse hotels in Vágar, Faroe Islands.'
    },
    {
      name: 'Streymoy',
      country: 'Faroe Islands',
      description: 'Browse hotels in Streymoy, Faroe Islands.'
    },
    {
      name: 'Eysturoy',
      country: 'Faroe Islands',
      description: 'Browse hotels in Eysturoy, Faroe Islands.'
    },
    {
      name: 'Ny-Ålesund',
      country: 'Svalbard',
      description: 'Browse hotels in Ny-Ålesund, Svalbard.'
    },
    {
      name: 'Kastelholm',
      country: 'Åland Islands',
      description: 'Browse hotels in Kastelholm, Åland Islands.'
    },
    {
      name: 'Bomarsund',
      country: 'Åland Islands',
      description: 'Browse hotels in Bomarsund, Åland Islands.'
    },
    {
      name: 'Isle of Skye',
      country: 'Scotland',
      description: 'Browse hotels in Isle of Skye, Scotland.'
    },
    {
      name: 'Kirkwall',
      country: 'Scotland',
      description: 'Browse hotels in Kirkwall, Scotland.'
    },
    {
      name: 'Tobermory',
      country: 'Scotland',
      description: 'Browse hotels in Tobermory, Scotland.'
    },
    {
      name: 'Uist',
      country: 'Scotland',
      description: 'Browse hotels in Uist, Scotland.'
    },
    {
      name: 'Tarbert (Harris)',
      country: 'Scotland',
      description: 'Browse hotels in Tarbert (Harris), Scotland.'
    },
    {
      name: 'Uig',
      country: 'Scotland',
      description: 'Browse hotels in Uig, Scotland.'
    },
    {
      name: 'Dunvegan',
      country: 'Scotland',
      description: 'Browse hotels in Dunvegan, Scotland.'
    },
    {
      name: 'Broadford',
      country: 'Scotland',
      description: 'Browse hotels in Broadford, Scotland.'
    },
    {
      name: 'Armadale',
      country: 'Scotland',
      description: 'Browse hotels in Armadale, Scotland.'
    },
    {
      name: 'Lochmaddy',
      country: 'Scotland',
      description: 'Browse hotels in Lochmaddy, Scotland.'
    }
  ],
  hotels: [
    {
      name: 'Hotel Nida Marina',
      city: 'Nida',
      country: 'Lithuania',
      url: 'hotel-nida-marina.html',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80',
      price: '0.07 ETH / night',
      priceEth: 0.07,
      description: 'Lagoon-side hotel in Nida with dune views and a short walk to the fishing harbour.'
    },
    {
      name: 'Barentsburg Guesthouse',
      city: 'Barentsburg',
      country: 'Svalbard',
      url: 'barentsburg-guesthouse.html',
      image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80',
      price: '0.09 ETH / night',
      priceEth: 0.09,
      description: 'Compact guesthouse in Barentsburg, above the harbour and the historic mining settlement.'
    },
    {
      name: 'Pyramiden Harbour House',
      city: 'Pyramiden',
      country: 'Svalbard',
      url: 'pyramiden-harbour-house.html',
      image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80',
      price: '0.08 ETH / night',
      priceEth: 0.08,
      description: 'Simple harbour stay in Pyramiden for guided visits to the preserved mining town.'
    },
    {
      name: 'Palanga Dune Hotel',
      city: 'Palanga',
      country: 'Lithuania',
      url: 'palanga-dune-hotel.html',
      image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80',
      price: '0.05 ETH / night',
      priceEth: 0.05,
      description: 'Pine-backed hotel in Palanga, between the botanical park and the Baltic beach.'
    },
    {
      name: 'Druskininkai Spa House',
      city: 'Druskininkai',
      country: 'Lithuania',
      url: 'druskininkai-spa-house.html',
      image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80',
      price: '0.06 ETH / night',
      priceEth: 0.06,
      description: 'Spa house in Druskininkai, near the Nemunas riverside promenade and the mineral springs.'
    },
    {
      name: 'Trakai Lake House',
      city: 'Trakai',
      country: 'Lithuania',
      url: 'trakai-lake-house.html',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80',
      price: '0.05 ETH / night',
      priceEth: 0.05,
      description: 'Lakeside house in Trakai, a short walk from the island castle.'
    },
    {
      name: 'Porvoo Old Town Hotel',
      city: 'Porvoo',
      country: 'Finland',
      url: 'porvoo-old-town-hotel.html',
      image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80',
      price: '0.07 ETH / night',
      priceEth: 0.07,
      description: 'Old-town hotel in Porvoo, among the red shore warehouses on the Porvoonjoki.'
    },
    {
      name: 'Kuopio Lakefront Hotel',
      city: 'Kuopio',
      country: 'Finland',
      url: 'kuopio-lakefront-hotel.html',
      image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80',
      price: '0.06 ETH / night',
      priceEth: 0.06,
      description: 'Lakefront hotel in Kuopio, close to the passenger harbour on Kallavesi.'
    },
    {
      name: 'Savonlinna Castle Hotel',
      city: 'Savonlinna',
      country: 'Finland',
      url: 'savonlinna-castle-hotel.html',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80',
      price: '0.08 ETH / night',
      priceEth: 0.08,
      description: 'Island hotel in Savonlinna, facing Olavinlinna across the strait.'
    },
    {
      name: 'Icehotel Jukkasjärvi',
      city: 'Jukkasjärvi',
      country: 'Sweden',
      url: 'icehotel-jukkasjarvi.html',
      image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80',
      price: '0.11 ETH / night',
      priceEth: 0.11,
      description: 'Ice rooms and a warm hotel in Jukkasjärvi, on the Torne River north of Kiruna.'
    },
    {
      name: 'Gjógv Guesthouse',
      city: 'Gjógv',
      country: 'Faroe Islands',
      url: 'gjogv-guesthouse.html',
      image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80',
      price: '0.08 ETH / night',
      priceEth: 0.08,
      description: 'Turf-roof guesthouse in Gjógv, above the sea gorge on the north coast of Eysturoy.'
    },
    {
      name: 'Saksun Turf House',
      city: 'Saksun',
      country: 'Faroe Islands',
      url: 'saksun-turf-house.html',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80',
      price: '0.07 ETH / night',
      priceEth: 0.07,
      description: 'Turf-roof house in Saksun, beside the lagoon where the stream meets the Atlantic.'
    },
    {
      name: 'Mykines Puffin Lodge',
      city: 'Mykines',
      country: 'Faroe Islands',
      url: 'mykines-puffin-lodge.html',
      image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80',
      price: '0.09 ETH / night',
      priceEth: 0.09,
      description: 'Cliffside lodge on Mykines, a short walk from the puffin slopes and the lighthouse path.'
    },
    {
      name: 'Nólsoy Harbour House',
      city: 'Nólsoy',
      country: 'Faroe Islands',
      url: 'nolsoy-harbour-house.html',
      image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80',
      price: '0.06 ETH / night',
      priceEth: 0.06,
      description: 'Harbour house on Nólsoy, the island facing Tórshavn across the sound.'
    },
    {
      name: 'Vágar Cliff Hotel',
      city: 'Vágar',
      country: 'Faroe Islands',
      url: 'vagar-cliff-hotel.html',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80',
      price: '0.08 ETH / night',
      priceEth: 0.08,
      description: 'Cliff hotel on Vágar, near the airport and the ridge above Sørvágsvatn.'
    },
    {
      name: 'Streymoy Valley Inn',
      city: 'Streymoy',
      country: 'Faroe Islands',
      url: 'streymoy-valley-inn.html',
      image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80',
      price: '0.07 ETH / night',
      priceEth: 0.07,
      description: 'Valley inn on Streymoy, between the mountain road and the villages west of Tórshavn.'
    },
    {
      name: 'Eysturoy Sound Hotel',
      city: 'Eysturoy',
      country: 'Faroe Islands',
      url: 'eysturoy-sound-hotel.html',
      image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80',
      price: '0.07 ETH / night',
      priceEth: 0.07,
      description: 'Sound-side hotel on Eysturoy, a base for the villages north of the undersea tunnel.'
    },
    {
      name: 'Ny-Ålesund Polar Lodge',
      city: 'Ny-Ålesund',
      country: 'Svalbard',
      url: 'ny-alesund-polar-lodge.html',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80',
      price: '0.12 ETH / night',
      priceEth: 0.12,
      description: 'Small lodge in Ny-Ålesund, the research settlement on Kongsfjorden.'
    },
    {
      name: 'Kastelholm Castle Inn',
      city: 'Kastelholm',
      country: 'Åland Islands',
      url: 'kastelholm-castle-inn.html',
      image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80',
      price: '0.08 ETH / night',
      priceEth: 0.08,
      description: 'Inn beside Kastelholm Castle, on the inland road from Mariehamn.'
    },
    {
      name: 'Bomarsund Fortress House',
      city: 'Bomarsund',
      country: 'Åland Islands',
      url: 'bomarsund-fortress-house.html',
      image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80',
      price: '0.06 ETH / night',
      priceEth: 0.06,
      description: 'Guest house by the Bomarsund fortress ruins, on the Åland shore.'
    },
    {
      name: 'Skye Cuillin Hotel',
      city: 'Isle of Skye',
      country: 'Scotland',
      url: 'skye-cuillin-hotel.html',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80',
      price: '0.09 ETH / night',
      priceEth: 0.09,
      description: 'Harbour hotel on the Isle of Skye, with views toward the Cuillin ridge and the sea cliffs.'
    },
    {
      name: 'Kirkwall Harbour Hotel',
      city: 'Kirkwall',
      country: 'Scotland',
      url: 'kirkwall-harbour-hotel.html',
      image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80',
      price: '0.08 ETH / night',
      priceEth: 0.08,
      description: 'Harbour hotel in Kirkwall, beside St Magnus Cathedral and the Orkney ferry pier.'
    },
    {
      name: 'Tobermory Waterfront Hotel',
      city: 'Tobermory',
      country: 'Scotland',
      url: 'tobermory-waterfront-hotel.html',
      image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80',
      price: '0.07 ETH / night',
      priceEth: 0.07,
      description: 'Waterfront hotel in Tobermory, on the coloured harbour of the Isle of Mull.'
    },
    {
      name: 'Uist Machair House',
      city: 'Uist',
      country: 'Scotland',
      url: 'uist-machair-house.html',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80',
      price: '0.06 ETH / night',
      priceEth: 0.06,
      description: 'Shore house on Uist, between the machair and the Atlantic beaches of the Outer Hebrides.'
    },
    {
      name: 'Tarbert Harris Hotel',
      city: 'Tarbert (Harris)',
      country: 'Scotland',
      url: 'tarbert-harris-hotel.html',
      image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80',
      price: '0.07 ETH / night',
      priceEth: 0.07,
      description: 'Pier hotel in Tarbert (Harris), where the ferry meets the Isle of Harris.'
    },
    {
      name: 'Uig Bay Hotel',
      city: 'Uig',
      country: 'Scotland',
      url: 'uig-bay-hotel.html',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80',
      price: '0.06 ETH / night',
      priceEth: 0.06,
      description: 'Bay hotel in Uig, at the Skye ferry pier for the Outer Hebrides.'
    },
    {
      name: 'Dunvegan Castle Hotel',
      city: 'Dunvegan',
      country: 'Scotland',
      url: 'dunvegan-castle-hotel.html',
      image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80',
      price: '0.09 ETH / night',
      priceEth: 0.09,
      description: 'Lochside hotel in Dunvegan, a short walk from Dunvegan Castle on the Isle of Skye.'
    },
    {
      name: 'Broadford Bay Hotel',
      city: 'Broadford',
      country: 'Scotland',
      url: 'broadford-bay-hotel.html',
      image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80',
      price: '0.07 ETH / night',
      priceEth: 0.07,
      description: 'Bay hotel in Broadford, on the south-east shore of the Isle of Skye.'
    },
    {
      name: 'Armadale Pier Hotel',
      city: 'Armadale',
      country: 'Scotland',
      url: 'armadale-pier-hotel.html',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80',
      price: '0.06 ETH / night',
      priceEth: 0.06,
      description: 'Pier hotel in Armadale, where the Mallaig ferry meets the Sleat peninsula.'
    },
    {
      name: 'Lochmaddy Harbour Hotel',
      city: 'Lochmaddy',
      country: 'Scotland',
      url: 'lochmaddy-harbour-hotel.html',
      image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80',
      price: '0.07 ETH / night',
      priceEth: 0.07,
      description: 'Harbour hotel in Lochmaddy, the ferry port on North Uist.'
    }
  ]
};
