# Quick Start Guide - Phase 1

Get the RAG Pipeline Tester running in 5 minutes!

## 🚀 Setup & Run

### 1. Backend Setup (Terminal 1)

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate it
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn app.main:app --reload
```

✅ **Backend running at:** http://localhost:8000
📚 **API docs:** http://localhost:8000/docs

### 2. Frontend Setup (Terminal 2)

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Run the dev server
npm run dev
```

✅ **Frontend running at:** http://localhost:5173

## 🧪 Test Phase 1

1. **Open browser** → http://localhost:5173
2. **Upload sample file**:
   - Click "Select File"
   - Choose `sample_docs/sample_text.txt`
   - Wait for processing (instant)
3. **View document**:
   - Click on the document in the list
   - See extracted text on the right
   - Check statistics (chars, words, tokens)
4. **Test features**:
   - Copy text using the button
   - Delete the document (trash icon)
   - Upload another file

## ✅ Success Criteria

- [ ] Backend shows "Application startup complete"
- [ ] Frontend loads without errors
- [ ] Can upload .txt file
- [ ] Document appears in list with "ready" status
- [ ] Can view extracted text
- [ ] Statistics display correctly
- [ ] Can delete document

## 🐛 Common Issues

**Backend won't start?**
```bash
# Check Python version
python --version  # Should be 3.9+

# Check if port 8000 is free
lsof -i :8000  # Mac/Linux
netstat -ano | findstr :8000  # Windows
```

**Frontend won't start?**
```bash
# Check Node version
node --version  # Should be 18+

# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Upload fails?**
- Verify backend is running (check http://localhost:8000/api/health)
- Check browser console for errors
- Try with the sample file first

## 📁 File Locations

- **Sample docs**: `sample_docs/sample_text.txt`
- **Uploaded files**: `uploads/` (created automatically)
- **Backend logs**: Terminal 1 output
- **Frontend logs**: Browser console

## 🎯 What's Working (Phase 1)

✅ File upload (.txt, .md files)
✅ Text extraction
✅ Document list with metadata
✅ Full text viewing
✅ Copy to clipboard
✅ Document deletion
✅ Error handling
✅ Loading states

## 📋 Next Steps

Once Phase 1 is working:
- ✅ Confirm all features work
- 📝 Note any issues or ideas
- 🚀 Ready for Phase 2 (Chunking)

## 💡 Pro Tips

1. **Keep both terminals open** - you'll see real-time logs
2. **Use the sample file first** - it's designed for testing
3. **Check the API docs** - http://localhost:8000/docs
4. **Watch the browser console** - helpful for debugging
5. **Backend auto-reloads** - just save Python files
6. **Frontend hot-reloads** - just save React files

---

**Need help?** Check the full README.md for detailed documentation.
