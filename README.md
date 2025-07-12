# Sharetribe Transaction Process Visualizer

![Sharetribe Process Visualizer](https://img.shields.io/badge/React-18.x-blue?style=for-the-badge&logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript) ![Vite](https://img.shields.io/badge/Vite-5.x-purple?style=for-the-badge&logo=vite) ![MIT License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

A powerful, interactive React.js application for parsing, visualizing, and creating Sharetribe transaction processes from EDN (Extensible Data Notation) format. Generate beautiful directed graphs of complex workflow structures with real-time editing capabilities.

## 🚀 Live Demo

Visit our live demo: [Sharetribe Process Visualizer](https://sharetribe-visualizer.replit.app)

## ✨ Features

### 🎯 Core Visualization
- **EDN Parser**: Advanced parser supporting both v2 and v3 Sharetribe process formats
- **Interactive Graphs**: Beautiful directed graphs with pan, zoom, and selection capabilities
- **Color-coded Transitions**: Actor-based color coding (Customer: Orange, Provider: Pink, Operator: Green, System: Gray)
- **Smart Layout**: Automatic tree-like vertical layout matching official Sharetribe visualizer design
- **Smooth Animations**: Curved edges and smooth transitions to prevent visual overlap

### 🛠️ Advanced Features
- **Local Storage**: Save, load, rename, and delete EDN files locally
- **Full-screen Mode**: Toggle input panel for immersive visualization experience
- **Details Panel**: Comprehensive state and transition information on click
- **Export Functionality**: Download graphs as JSON for sharing and backup
- **Manual Graph Builder**: Create custom process flows visually with drag-and-drop interface

### 🎨 User Experience
- **Light Theme**: Clean, professional design optimized for readability
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **SEO Optimized**: Comprehensive meta tags and structured data
- **Accessibility**: ARIA labels and keyboard navigation support

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js 18.x or higher
- npm or yarn package manager

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/sharetribe-process-visualizer.git
cd sharetribe-process-visualizer
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```

4. **Open in browser**
Navigate to `http://localhost:5000`

## 📖 Usage Guide

### Basic Visualization
1. **Input EDN**: Paste your Sharetribe transaction process EDN code
2. **Load Sample**: Click "Load Sample" to try with example data
3. **Visualize**: Click "Visualize Process" to generate the graph
4. **Interact**: Click nodes/edges for detailed information

### File Management
- **Save**: Store your EDN files locally with custom names
- **Load**: Access previously saved files from the Files dialog
- **Rename**: Edit file names for better organization
- **Delete**: Remove unwanted files from storage

### Graph Builder
1. **Access Builder**: Click "Graph Builder" in the header
2. **Add States**: Create new states with different types (initial, intermediate, final)
3. **Add Transitions**: Connect states with actor-based transitions
4. **Edit Elements**: Click to select and modify existing elements
5. **Export**: Save your custom graph as JSON

## 🔧 Technical Architecture

### Frontend Stack
- **React 18**: Modern hooks-based architecture
- **TypeScript**: Type-safe development
- **Vite**: Lightning-fast build tool
- **ReactFlow**: Interactive graph visualization
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Modern component library

### Backend Stack
- **Express.js**: Node.js web framework
- **TypeScript**: Server-side type safety
- **PostgreSQL**: Database with Drizzle ORM
- **Session Management**: Secure user sessions

### Key Libraries
- **EDN Parser**: Custom implementation for Sharetribe formats
- **Graph Generator**: Converts EDN to ReactFlow format
- **Wouter**: Lightweight routing
- **React Hook Form**: Form management
- **Zod**: Runtime type validation

## 🎯 Supported Formats

### EDN v2 Format
```clojure
{:process/id :example-process
 :process/states #{:initial :pending :completed}
 :process/transitions
 [{:transition/id :initiate
   :transition/from :initial
   :transition/to :pending
   :transition/actor :actor.role/customer}]}
```

### EDN v3 Format
```clojure
{:format :v3
 :transitions
 [{:name :transition/initiate
   :actor :actor.role/customer
   :actions [{:name :action/create-booking}]
   :to :state/pending}]}
```

## 🌟 What is Sharetribe?

Sharetribe is a marketplace platform that enables businesses to build custom online marketplaces. Transaction processes define the workflow and states that transactions go through in these marketplaces, including:

- **Booking flows** for service marketplaces
- **Payment processing** with multiple actors
- **State management** for complex workflows
- **Automated actions** and notifications

## 🤝 Contributing

We welcome contributions! This is an open-source project designed to help the Sharetribe community.

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch**
```bash
git checkout -b feature/amazing-feature
```

3. **Make your changes**
4. **Add tests** if applicable
5. **Commit your changes**
```bash
git commit -m 'Add amazing feature'
```

6. **Push to the branch**
```bash
git push origin feature/amazing-feature
```

7. **Open a Pull Request**

### Development Guidelines
- Follow existing code style and patterns
- Add TypeScript types for new features
- Update documentation for significant changes
- Test thoroughly before submitting

## 📋 Roadmap

- [ ] **PDF Export**: Export graphs as PDF/PNG images
- [ ] **Real-time Collaboration**: Multiple users editing simultaneously
- [ ] **Process Validation**: Validate EDN processes against Sharetribe schema
- [ ] **Templates**: Pre-built process templates for common use cases
- [ ] **Integration**: Direct integration with Sharetribe API
- [ ] **Advanced Analytics**: Process complexity analysis and optimization suggestions

## 🐛 Bug Reports & Feature Requests

Found a bug or have a feature request? Please create an issue on our [GitHub repository](https://github.com/yourusername/sharetribe-process-visualizer/issues).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Sharetribe Team**: For creating an amazing marketplace platform
- **React Flow Team**: For the excellent graph visualization library
- **Open Source Community**: For inspiration and contributions

## 📞 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/yourusername/sharetribe-process-visualizer/issues)
- **Discussions**: [Join community discussions](https://github.com/yourusername/sharetribe-process-visualizer/discussions)
- **Email**: [support@sharetribe-visualizer.com](mailto:support@sharetribe-visualizer.com)

---

**Keywords**: Sharetribe, EDN, transaction process, workflow visualization, marketplace, React, TypeScript, process builder, graph visualization, flow diagram, state machine, business process, marketplace development

Made with ❤️ for the Sharetribe community | [GitHub](https://github.com/yourusername/sharetribe-process-visualizer) | [Live Demo](https://sharetribe-visualizer.replit.app)