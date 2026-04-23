import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export interface ChatMessage {
  role: 'user' | 'model'
  parts: { text: string }[]
}

export async function generateReply({
  message,
  history = [],
  systemPrompt = 'أنت مساعد ذكي ودود. أجب باللغة التي يكتب بها المستخدم.',
  maxTokens = 200,
}: {
  message: string
  history?: ChatMessage[]
  systemPrompt?: string
  maxTokens?: number
}): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemPrompt,
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.7,
      },
    })

    const chat = model.startChat({ history })
    const result = await chat.sendMessage(message)
    return result.response.text()
  } catch (error: any) {
    console.error('Gemini error:', error)
    throw new Error('فشل في الاتصال بخدمة الذكاء الاصطناعي')
  }
}

export async function generateBulkMessages(template: string, contacts: { name?: string; phone: string }[]): Promise<string[]> {
  return contacts.map(c => {
    return template
      .replace(/\{\{اسم\}\}/g, c.name || 'عزيزي العميل')
      .replace(/\{\{رقم\}\}/g, c.phone)
      .replace(/\{\{تاريخ\}\}/g, new Date().toLocaleDateString('ar-SA'))
  })
}
