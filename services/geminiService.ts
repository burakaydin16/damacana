
import { GoogleGenAI } from "@google/genai";
import { DataService } from "./dataService";

const getSystemInstruction = async () => {
    // Veritabanından verileri çek
    const products = await DataService.getProducts();
    const customers = await DataService.getCustomers();
    const transactions = (await DataService.getTransactions()).slice(0, 50);

    const dataContext = JSON.stringify({
        stock: products.map(p => ({ name: p.name, stock: p.stock, price: p.price })),
        customers: customers.map(c => ({ name: c.name, type: c.type, debt: c.cash_balance, depositBalances: c.deposit_balances })),
        recentTransactions: transactions.map(t => ({ date: t.date, total: t.total_amount, items: t.items.length }))
    });

    return `
    Sen bir su dağıtım firmasının yapay zeka asistanısın. Görevin, dağıtımcının işini kolaylaştırmak için verileri analiz etmek.
    Aşağıdaki JSON verilerine sahipsin:
    ${dataContext}

    Kullanıcı sana sorular soracak (örneğin: "En çok borcu olan kim?", "Elimde kaç tane boş damacana var?", "Satışlar nasıl gidiyor?").
    Cevapların kısa, net ve Türkçe olmalı. Gerektiğinde önerilerde bulun (örneğin: "X firmasının çok fazla boş damacana borcu birikmiş, iade istemelisin").
    `;
};

export const askGemini = async (question: string): Promise<string> => {
    try {
        const apiKey = process.env.API_KEY;
        if (!apiKey) throw new Error("API Key eksik");

        const ai = new GoogleGenAI({ apiKey });
        
        // System instruction'ı veritabanından gelen verilerle oluştur
        const instruction = await getSystemInstruction();
        
        const model = ai.models;
        
        const response = await model.generateContent({
            model: 'gemini-2.5-flash',
            contents: question,
            config: {
                systemInstruction: instruction,
            }
        });

        return response.text || "Bir cevap oluşturulamadı.";
    } catch (error) {
        console.error("Gemini Error:", error);
        return "Üzgünüm, şu anda asistan hizmetine ulaşılamıyor. Lütfen API anahtarınızı kontrol edin.";
    }
};
