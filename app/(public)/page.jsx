'use client'
import Link from 'next/link';
import { Clock, Gavel, TrendingUp, Shield } from 'lucide-react';

export default function Home() {
    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white py-20 lg:py-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                            Welcome to GoCart Auctions
                        </h1>
                        <p className="text-xl sm:text-2xl mb-8 text-gray-100 max-w-3xl mx-auto">
                            Discover unique items, place bids, and win amazing deals in real-time auctions
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link 
                                href="/listings" 
                                className="bg-white text-purple-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
                            >
                                <Gavel className="mr-2" size={24} />
                                Browse Auctions
                            </Link>
                            <Link 
                                href="/listings/create" 
                                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/10 transition-colors inline-flex items-center justify-center"
                            >
                                Create Listing
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
                        Why Choose GoCart Auctions?
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-4">
                                <Clock size={32} />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Real-Time Bidding</h3>
                            <p className="text-gray-600">
                                Live updates with instant notifications when you're outbid
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 text-purple-600 rounded-full mb-4">
                                <Gavel size={32} />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Timed Auctions</h3>
                            <p className="text-gray-600">
                                Set your auction duration and watch bids roll in
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 text-pink-600 rounded-full mb-4">
                                <TrendingUp size={32} />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Smart Analytics</h3>
                            <p className="text-gray-600">
                                Track your listings performance with detailed insights
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-4">
                                <Shield size={32} />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Secure Payments</h3>
                            <p className="text-gray-600">
                                Stripe-powered payments with buyer and seller protection
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                        Ready to Start Bidding?
                    </h2>
                    <p className="text-xl mb-8 text-gray-100">
                        Join thousands of buyers and sellers in the most exciting auction platform
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link 
                            href="/register" 
                            className="bg-white text-purple-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition-colors"
                        >
                            Create Free Account
                        </Link>
                        <Link 
                            href="/listings" 
                            className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/10 transition-colors"
                        >
                            Explore Auctions
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
