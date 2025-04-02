import Navbar from '../../components/site/Navbar'
import Footer from '../../components/site/Footer'

export default function SiteLayout({ children }) {
  return (
    <main>
      <Navbar/>
      <h1 className="text-4xl font-bold">Site</h1>
      { children}
      <Footer/>
    </main>
  )
}