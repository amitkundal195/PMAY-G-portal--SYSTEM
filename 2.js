// ---------------- PMAY-G Portal JS ----------------
(function(){
  const LS_KEY = 'pmayg_apps_v1';
  const SESSION_KEY = 'pmayg_session';

  // ---------- Utilities ----------
  function uid(){ return 'APP-' + Date.now().toString(36).slice(-6); }
  function readApps(){ return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
  function writeApps(arr){ localStorage.setItem(LS_KEY, JSON.stringify(arr)); }

  function showMessage(elemId, text, color){
    if(elemId){
      const el = document.getElementById(elemId);
      if(el){ el.textContent=text; el.style.color=color==='red'?'crimson':'green';
        setTimeout(()=>el.textContent='',4000); return; }
    }
    alert(text);
  }

  function escapeHtml(s){ if(!s) return ''; return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  // ---------- Registration ----------
  const regForm = document.getElementById('registrationForm');
  if(regForm){
    regForm.addEventListener('submit', function(e){
      e.preventDefault();
      const data = {
        id: uid(),
        name: document.getElementById('name').value.trim(),
        guardian: document.getElementById('guardian').value.trim(),
        age: document.getElementById('age').value,
        mobile: document.getElementById('mobile').value.trim(),
        aadhaar: document.getElementById('aadhaar').value.trim(),
        state: document.getElementById('state').value.trim(),
        district: document.getElementById('district').value.trim(),
        address: document.getElementById('address').value.trim(),
        house_type: document.getElementById('house_type').value,
        income: document.getElementById('income').value,
        status: 'Pending',
        createdAt: new Date().toISOString()
      };

      const apps = readApps();
      if(apps.find(a=>a.aadhaar===data.aadhaar)){
        showMessage('formMessage','Application with this Aadhaar exists. Please login.','red'); return;
      }
      apps.push(data); writeApps(apps);
      regForm.reset();
      showMessage('formMessage','Application submitted successfully. Note Aadhaar for login.','green');
    });
  }

  // ---------- Login ----------
  const loginForm = document.getElementById('loginForm');
  if(loginForm){
    const loginType = document.getElementById('loginType');
    const beneficiaryFields = document.getElementById('beneficiaryFields');
    const adminFields = document.getElementById('adminFields');

    loginType.addEventListener('change', ()=>{
      if(loginType.value==='admin'){ beneficiaryFields.style.display='none'; adminFields.style.display='block'; }
      else{ beneficiaryFields.style.display='block'; adminFields.style.display='none'; }
    });

    loginForm.addEventListener('submit', function(e){
      e.preventDefault();
      const type = loginType.value;
      if(type==='beneficiary'){
        const aadhaar = document.getElementById('loginAadhaar').value.trim();
        const mobile = document.getElementById('loginMobile').value.trim();
        const apps = readApps();
        const user = apps.find(a=>a.aadhaar===aadhaar && a.mobile===mobile);
        if(user){
          localStorage.setItem(SESSION_KEY, JSON.stringify({type:'beneficiary', user:user}));
          window.location.href='status.html';
        } else showMessage(null,'No matching application found. Please register first.','red');
      } else {
        const user = document.getElementById('adminUser').value.trim();
        const pass = document.getElementById('adminPass').value.trim();
        if(user==='admin' && pass==='admin123'){
          localStorage.setItem(SESSION_KEY, JSON.stringify({type:'admin', user:'admin'}));
          window.location.href='admin.html';
        } else showMessage(null,'Invalid admin credentials.','red');
      }
    });
  }

  // ---------- Beneficiary Dashboard (Update Form) ----------
  const appView = document.getElementById('appView');
  if(appView){
    const session = JSON.parse(localStorage.getItem(SESSION_KEY)||'null');
    if(!session || session.type!=='beneficiary'){
      document.getElementById('welcomeMsg').textContent='Please login as beneficiary first via Login page.';
    } else {
      const apps = readApps();
      const me = apps.find(a=>a.aadhaar===session.user.aadhaar);
      if(!me){ document.getElementById('welcomeMsg').textContent='No application found. Please register.'; }
      else{
        document.getElementById('welcomeMsg').style.display='none';
        appView.style.display='block';

        document.getElementById('u_name').value = me.name;
        document.getElementById('u_guardian').value = me.guardian;
        document.getElementById('u_age').value = me.age;
        document.getElementById('u_mobile').value = me.mobile;
        document.getElementById('u_aadhaar').value = me.aadhaar;
        document.getElementById('u_state').value = me.state;
        document.getElementById('u_district').value = me.district;
        document.getElementById('u_address').value = me.address;
        document.getElementById('u_house_type').value = me.house_type;
        document.getElementById('u_income').value = me.income;
        document.getElementById('appId').textContent = me.id;
        document.getElementById('appStatus').textContent = me.status;

        const updateForm = document.getElementById('updateForm');
        updateForm.addEventListener('submit', function(e){
          e.preventDefault();
          me.name=document.getElementById('u_name').value.trim();
          me.guardian=document.getElementById('u_guardian').value.trim();
          me.age=document.getElementById('u_age').value;
          me.mobile=document.getElementById('u_mobile').value.trim();
          me.state=document.getElementById('u_state').value.trim();
          me.district=document.getElementById('u_district').value.trim();
          me.address=document.getElementById('u_address').value.trim();
          me.house_type=document.getElementById('u_house_type').value;
          me.income=document.getElementById('u_income').value;
          me.updatedAt=new Date().toISOString();
          writeApps(apps);
          document.getElementById('appStatus').textContent=me.status;
          showMessage(null,'Application updated successfully.','green');
        });

        document.getElementById('logoutBtn').addEventListener('click', ()=>{
          localStorage.removeItem(SESSION_KEY); window.location.href='index.html';
        });
      }
    }
  }

  // ---------- Admin Dashboard ----------
  const appsTable = document.getElementById('appsTable');
  if(appsTable){
    function renderApps(){
      const tbody = appsTable.querySelector('tbody'); tbody.innerHTML='';
      const apps = readApps();
      if(apps.length===0){
        const tr=document.createElement('tr');
        tr.innerHTML=`<td colspan="7" style="text-align:center;">No applications found.</td>`;
        tbody.appendChild(tr); return;
      }

      apps.forEach(app=>{
        const tr=document.createElement('tr');
        let statusClass = app.status==='Approved'?'status-approved':
                          app.status==='Rejected'?'status-rejected':'status-pending';
        tr.innerHTML=`
          <td>${app.id}</td>
          <td>${escapeHtml(app.name)}</td>
          <td>${app.aadhaar}</td>
          <td>${escapeHtml(app.district)}</td>
          <td>${escapeHtml(app.house_type)}</td>
          <td><span class="${statusClass}">${app.status}</span></td>
          <td></td>
        `;
        const actionTd = tr.querySelector('td:last-child');

        const approveBtn=document.createElement('button');
        approveBtn.className='btn'; approveBtn.textContent='Approve';
        approveBtn.addEventListener('click', ()=>{ app.status='Approved'; writeApps(apps); renderApps(); });

        const rejectBtn=document.createElement('button');
        rejectBtn.className='btn btn-outline'; rejectBtn.textContent='Reject';
        rejectBtn.addEventListener('click', ()=>{ app.status='Rejected'; writeApps(apps); renderApps(); });

        const openBtn=document.createElement('button');
        openBtn.className='btn'; openBtn.textContent='Open';
        openBtn.addEventListener('click', ()=>{
          localStorage.setItem(SESSION_KEY, JSON.stringify({type:'beneficiary', user:app}));
          window.location.href='my-application.html';
        });

        const delBtn=document.createElement('button');
        delBtn.className='btn btn-outline'; delBtn.textContent='Delete';
        delBtn.addEventListener('click', ()=>{ 
          if(confirm('Delete this application?')){
            const idx=apps.findIndex(x=>x.id===app.id);
            apps.splice(idx,1); writeApps(apps); renderApps();
          }
        });

        actionTd.appendChild(approveBtn); actionTd.appendChild(rejectBtn);
        actionTd.appendChild(openBtn); actionTd.appendChild(delBtn);
        tbody.appendChild(tr);
      });
    }

    document.getElementById('seedData').addEventListener('click', ()=>{
      const sample = [
        {id:uid(),name:'Ram Kumar',guardian:'Shyam',age:45,mobile:'9876543210',aadhaar:'111122223333',state:'State A',district:'District X',address:'Village Road',house_type:'kutcha',income:60000,status:'Pending',createdAt:new Date().toISOString()},
        {id:uid(),name:'Sita Devi',guardian:'Ramesh',age:38,mobile:'9123456780',aadhaar:'222233334444',state:'State B',district:'District Y',address:'Haat Road',house_type:'dilapidated',income:35000,status:'Pending',createdAt:new Date().toISOString()}
      ];
      const apps=readApps(); apps.push(...sample); writeApps(apps); renderApps();
    });

    document.getElementById('clearData').addEventListener('click', ()=>{
      if(confirm('Clear all applications?')){ localStorage.removeItem(LS_KEY); renderApps(); }
    });

    renderApps();
  }

})();
