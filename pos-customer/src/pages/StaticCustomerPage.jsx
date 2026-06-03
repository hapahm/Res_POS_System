import CustomerHeader from "../components/customer/CustomerHeader";
import Footer from "../components/customer/Footer";

const StaticCustomerPage = ({ title, description }) => {
    return (
        <main className="min-h-screen bg-slate-100 text-slate-800">
            <CustomerHeader />
            <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <h1 className="text-3xl font-semibold text-slate-800">{title}</h1>
                    <p className="mt-3 text-sm text-slate-600">{description}</p>
                </div>
            </section>

            <Footer />
        </main>
    );
};

export default StaticCustomerPage;